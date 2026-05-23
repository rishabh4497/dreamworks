use std::collections::BTreeSet;
use std::fs::File;
use std::io::Read;
use std::path::Path;

use memmap2::Mmap;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

const SDK_MARKER: &[u8] = b"__DREAMWORKS_SDK_MARKER_V1__";
const MANIFEST_FILENAME: &str = "dreamworks.manifest.json";
const MAX_BINARY_SCAN_BYTES: usize = 2 * 1024 * 1024 * 1024;

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct BuildScanReport {
    pub marker_found: bool,
    pub sdk_version: Option<String>,
    pub executable_name: Option<String>,
    pub found_achievement_ids: Vec<String>,
    pub manifest: Option<JsonValue>,
    pub errors: Vec<String>,
}

#[tauri::command]
pub fn scan_build_archive(path: String) -> BuildScanReport {
    let mut report = BuildScanReport::default();
    let archive_path = Path::new(&path);
    let file = match File::open(archive_path) {
        Ok(f) => f,
        Err(err) => {
            report.errors.push(format!("Could not open archive: {err}"));
            return report;
        }
    };

    let mut zip = match zip::ZipArchive::new(file) {
        Ok(z) => z,
        Err(err) => {
            report.errors.push(format!("Could not parse zip: {err}"));
            return report;
        }
    };

    let mut manifest_executable: Option<String> = None;
    if let Some(value) = read_manifest(&mut zip, &mut report.errors) {
        manifest_executable = value
            .get("executable")
            .and_then(JsonValue::as_str)
            .map(str::to_owned);
        report.sdk_version = value
            .get("sdkVersion")
            .and_then(JsonValue::as_str)
            .map(str::to_owned);
        report.manifest = Some(value);
    }

    let executable_target = match pick_executable(&mut zip, manifest_executable.as_deref()) {
        Some(name) => name,
        None => {
            report
                .errors
                .push("No executable found inside the build archive.".into());
            return report;
        }
    };
    report.executable_name = Some(executable_target.clone());

    match zip.by_name(&executable_target) {
        Ok(mut entry) => {
            let mut buffer = Vec::with_capacity(entry.size().min(MAX_BINARY_SCAN_BYTES as u64) as usize);
            if let Err(err) = entry.read_to_end(&mut buffer) {
                report
                    .errors
                    .push(format!("Could not read executable: {err}"));
                return report;
            }
            scan_buffer(&buffer, &mut report);
        }
        Err(err) => {
            report
                .errors
                .push(format!("Executable not present in zip: {err}"));
        }
    }

    report
}

#[tauri::command]
pub fn scan_local_executable(path: String) -> BuildScanReport {
    let mut report = BuildScanReport::default();
    report.executable_name = Path::new(&path)
        .file_name()
        .and_then(|s| s.to_str())
        .map(str::to_owned);

    let file = match File::open(&path) {
        Ok(f) => f,
        Err(err) => {
            report.errors.push(format!("Could not open binary: {err}"));
            return report;
        }
    };

    match unsafe { Mmap::map(&file) } {
        Ok(mmap) => {
            scan_buffer(&mmap, &mut report);
        }
        Err(err) => {
            report.errors.push(format!("Could not mmap binary: {err}"));
        }
    }

    report
}

fn read_manifest(
    zip: &mut zip::ZipArchive<File>,
    errors: &mut Vec<String>,
) -> Option<JsonValue> {
    let mut entry = match zip.by_name(MANIFEST_FILENAME) {
        Ok(e) => e,
        Err(_) => {
            errors.push(format!("Missing {MANIFEST_FILENAME} at archive root."));
            return None;
        }
    };
    let mut buf = String::new();
    if let Err(err) = entry.read_to_string(&mut buf) {
        errors.push(format!("Could not read manifest: {err}"));
        return None;
    }
    match serde_json::from_str::<JsonValue>(&buf) {
        Ok(value) => Some(value),
        Err(err) => {
            errors.push(format!("Manifest is not valid JSON: {err}"));
            None
        }
    }
}

fn pick_executable(
    zip: &mut zip::ZipArchive<File>,
    declared: Option<&str>,
) -> Option<String> {
    if let Some(name) = declared {
        if zip.by_name(name).is_ok() {
            return Some(name.to_owned());
        }
    }
    let mut best: Option<(String, u64)> = None;
    for i in 0..zip.len() {
        if let Ok(entry) = zip.by_index(i) {
            let name = entry.name().to_string();
            let size = entry.size();
            let lower = name.to_lowercase();
            if lower.ends_with(".exe")
                || lower.ends_with(".app")
                || lower.ends_with(".bin")
                || (!lower.contains('.') && !entry.is_dir())
            {
                match &best {
                    Some((_, current)) if *current >= size => {}
                    _ => best = Some((name, size)),
                }
            }
        }
    }
    best.map(|(name, _)| name)
}

fn scan_buffer(buffer: &[u8], report: &mut BuildScanReport) {
    report.marker_found = find_subsequence(buffer, SDK_MARKER).is_some();

    let mut ids: BTreeSet<String> = BTreeSet::new();
    let mut current = Vec::with_capacity(48);
    for &byte in buffer {
        if (0x20..=0x7e).contains(&byte) {
            current.push(byte);
        } else {
            collect_achievement_ids(&current, &mut ids);
            current.clear();
        }
        if current.len() > 256 {
            collect_achievement_ids(&current, &mut ids);
            current.clear();
        }
    }
    collect_achievement_ids(&current, &mut ids);
    report.found_achievement_ids = ids.into_iter().collect();
}

fn collect_achievement_ids(bytes: &[u8], out: &mut BTreeSet<String>) {
    if bytes.len() < 5 {
        return;
    }
    let s = match std::str::from_utf8(bytes) {
        Ok(v) => v,
        Err(_) => return,
    };
    let mut i = 0;
    while let Some(pos) = s[i..].find("ach_") {
        let start = i + pos;
        let mut end = start + 4;
        while end < s.len() {
            let c = s.as_bytes()[end];
            let ok = c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'_';
            if !ok {
                break;
            }
            end += 1;
        }
        let token = &s[start..end];
        if token.len() > 4 && token.len() <= 44 {
            out.insert(token.to_owned());
        }
        i = end;
    }
}

fn find_subsequence(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || haystack.len() < needle.len() {
        return None;
    }
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}
