use serde::{Deserialize, Serialize};
use serde_json::Value;
use sysinfo::{Disks, Networks, ProcessRefreshKind, ProcessesToUpdate, System};
use std::{
    env, fs,
    path::{Path, PathBuf},
    process::Command,
    sync::Mutex,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager};
use tauri::async_runtime::{spawn, JoinHandle};
use tokio::time::sleep;

// ... (skip down to the end to add read_hardware_info and add to invoke_handler)

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CommandError {
    code: String,
    message: String,
    recoverable: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CommandResult<T> {
    ok: bool,
    data: Option<T>,
    error: Option<CommandError>,
}

fn ok<T: Serialize>(data: T) -> CommandResult<T> {
    CommandResult {
        ok: true,
        data: Some(data),
        error: None,
    }
}

fn err<T>(code: &str, message: impl Into<String>, recoverable: bool) -> CommandResult<T> {
    CommandResult {
        ok: false,
        data: None,
        error: Some(CommandError {
            code: code.to_string(),
            message: message.into(),
            recoverable,
        }),
    }
}

fn now_stamp() -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or_default();
    millis.to_string()
}

fn os_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "mac"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    }
}

fn home_dir() -> Option<PathBuf> {
    env::var_os("HOME")
        .or_else(|| env::var_os("USERPROFILE"))
        .map(PathBuf::from)
}

fn normalize_path(path: &str) -> String {
    path.replace('\\', "/")
}

fn extract_vdf_value(text: &str, key: &str) -> Option<String> {
    for line in text.lines() {
        let trimmed = line.trim();
        if !trimmed.starts_with('"') || !trimmed.contains(key) {
            continue;
        }
        let parts: Vec<&str> = trimmed.split('"').collect();
        if parts.len() >= 5 && parts[1].eq_ignore_ascii_case(key) {
            return Some(parts[3].to_string());
        }
    }
    None
}

fn extract_steam_library_paths(text: &str) -> Vec<PathBuf> {
    text.lines()
        .filter_map(|line| extract_vdf_value(line, "path"))
        .map(|path| PathBuf::from(normalize_path(&path)))
        .collect()
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScanLaunchersRequest {
    consent_granted: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeDetectedGame {
    launcher: String,
    external_id: String,
    name: String,
    install_path: Option<String>,
    launch_command: Option<String>,
    size_bytes: Option<u64>,
    manifest_path: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LauncherScanData {
    detected: Vec<NativeDetectedGame>,
    paths_read: Vec<String>,
    duration_ms: u128,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LaunchGameRequest {
    game_id: String,
    source_launcher: Option<String>,
    executable_path: Option<String>,
    launch_command: Option<String>,
    working_dir: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LaunchGameData {
    game_id: String,
    process_id: Option<u32>,
    launched_at: String,
    source_launcher: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct InstallGameRequest {
    game_id: String,
    source_launcher: Option<String>,
    install_path: String,
    size_bytes: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadCommandData {
    task_id: String,
    game_id: String,
    status: String,
    install_path: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct VerifyInstallRequest {
    game_id: String,
    install_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VerifyInstallData {
    game_id: String,
    install_path: String,
    exists: bool,
    verified_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MoveInstallRequest {
    game_id: String,
    from_path: String,
    to_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MoveInstallData {
    game_id: String,
    from_path: String,
    to_path: String,
    moved_at: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UninstallGameRequest {
    game_id: String,
    install_path: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenInstallFolderRequest {
    install_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UninstallGameData {
    game_id: String,
    uninstalled_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OpenFolderData {
    opened: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemCapabilities {
    os: String,
    arch: String,
    home_dir: Option<String>,
    can_open_folders: bool,
    can_spawn_processes: bool,
    can_scan_launchers: bool,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Dreamworks.", name)
}

#[tauri::command]
fn scan_launchers(request: ScanLaunchersRequest) -> CommandResult<LauncherScanData> {
    if !request.consent_granted {
        return err(
            "consent_required",
            "Launcher scanning requires explicit local-file consent.",
            true,
        );
    }

    let started = Instant::now();
    let mut detected = Vec::new();
    let mut paths_read = Vec::new();
    scan_steam(&mut detected, &mut paths_read);
    scan_epic(&mut detected, &mut paths_read);

    ok(LauncherScanData {
        detected,
        paths_read,
        duration_ms: started.elapsed().as_millis(),
    })
}

fn candidate_steam_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    if cfg!(target_os = "windows") {
        roots.push(PathBuf::from("C:/Program Files (x86)/Steam"));
        roots.push(PathBuf::from("C:/Program Files/Steam"));
    } else if cfg!(target_os = "macos") {
        if let Some(home) = home_dir() {
            roots.push(home.join("Library/Application Support/Steam"));
        }
    } else if cfg!(target_os = "linux") {
        if let Some(home) = home_dir() {
            roots.push(home.join(".steam/steam"));
            roots.push(home.join(".local/share/Steam"));
        }
    }
    roots
}

fn scan_steam(detected: &mut Vec<NativeDetectedGame>, paths_read: &mut Vec<String>) {
    let mut seen = std::collections::HashSet::new();
    for root in candidate_steam_roots() {
        if !root.exists() {
            continue;
        }
        let library_vdf = root.join("config/libraryfolders.vdf");
        let mut library_roots = vec![root.clone()];
        if let Ok(text) = fs::read_to_string(&library_vdf) {
            paths_read.push(library_vdf.to_string_lossy().to_string());
            for path in extract_steam_library_paths(&text) {
                if !library_roots.contains(&path) {
                    library_roots.push(path);
                }
            }
        }

        for library_root in library_roots {
            let steamapps = library_root.join("steamapps");
            let Ok(entries) = fs::read_dir(&steamapps) else {
                continue;
            };
            for entry in entries.flatten() {
                let path = entry.path();
                let Some(file_name) = path.file_name().and_then(|n| n.to_str()) else {
                    continue;
                };
                if !file_name.starts_with("appmanifest_") || !file_name.ends_with(".acf") {
                    continue;
                }
                let Ok(text) = fs::read_to_string(&path) else {
                    continue;
                };
                paths_read.push(path.to_string_lossy().to_string());
                let Some(appid) = extract_vdf_value(&text, "appid") else {
                    continue;
                };
                if !seen.insert(appid.clone()) {
                    continue;
                }
                let Some(name) = extract_vdf_value(&text, "name") else {
                    continue;
                };
                let install_path = extract_vdf_value(&text, "installdir")
                    .map(|dir| steamapps.join("common").join(dir).to_string_lossy().to_string());
                let size_bytes = extract_vdf_value(&text, "SizeOnDisk").and_then(|v| v.parse().ok());
                detected.push(NativeDetectedGame {
                    launcher: "steam".to_string(),
                    external_id: appid.clone(),
                    name,
                    install_path,
                    launch_command: Some(format!("steam://rungameid/{}", appid)),
                    size_bytes,
                    manifest_path: Some(path.to_string_lossy().to_string()),
                });
            }
        }
    }
}

fn candidate_epic_manifest_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if cfg!(target_os = "windows") {
        dirs.push(PathBuf::from(
            "C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests",
        ));
    } else if cfg!(target_os = "macos") {
        dirs.push(PathBuf::from(
            "/Users/Shared/Epic/EpicGamesLauncher/Data/Manifests",
        ));
    }
    dirs
}

fn json_string(value: &Value, key: &str) -> Option<String> {
    value.get(key).and_then(|v| v.as_str()).map(str::to_string)
}

fn scan_epic(detected: &mut Vec<NativeDetectedGame>, paths_read: &mut Vec<String>) {
    let mut seen = std::collections::HashSet::new();
    for dir in candidate_epic_manifest_dirs() {
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("item") {
                continue;
            }
            let Ok(text) = fs::read_to_string(&path) else {
                continue;
            };
            paths_read.push(path.to_string_lossy().to_string());
            let Ok(value) = serde_json::from_str::<Value>(&text) else {
                continue;
            };
            let external_id = json_string(&value, "AppName")
                .or_else(|| json_string(&value, "CatalogItemId"))
                .or_else(|| json_string(&value, "DisplayName"));
            let Some(external_id) = external_id else {
                continue;
            };
            if !seen.insert(external_id.clone()) {
                continue;
            }
            let name = json_string(&value, "DisplayName")
                .or_else(|| json_string(&value, "AppName"))
                .unwrap_or_else(|| "Unknown Epic title".to_string());
            let install_path = json_string(&value, "InstallLocation");
            let launch_command = match (
                install_path.as_ref(),
                json_string(&value, "LaunchExecutable"),
            ) {
                (Some(root), Some(exe)) => Some(Path::new(root).join(exe).to_string_lossy().to_string()),
                _ => None,
            };
            detected.push(NativeDetectedGame {
                launcher: "epic".to_string(),
                external_id,
                name,
                install_path,
                launch_command,
                size_bytes: value.get("InstallSize").and_then(|v| v.as_u64()),
                manifest_path: Some(path.to_string_lossy().to_string()),
            });
        }
    }
}

#[tauri::command]
fn launch_game(request: LaunchGameRequest) -> CommandResult<LaunchGameData> {
    if let Some(executable_path) = request.executable_path.as_deref() {
        let path = Path::new(executable_path);
        if !path.exists() {
            return err("missing_executable", "The configured executable does not exist.", true);
        }
        let mut command = Command::new(path);
        if let Some(working_dir) = request.working_dir.as_deref() {
            command.current_dir(working_dir);
        }
        return match command.spawn() {
            Ok(child) => ok(LaunchGameData {
                game_id: request.game_id,
                process_id: Some(child.id()),
                launched_at: now_stamp(),
                source_launcher: request.source_launcher,
            }),
            Err(error) => err("spawn_failed", error.to_string(), true),
        };
    }

    if let Some(launch_command) = request.launch_command.as_deref() {
        if !launch_command.contains("://") {
            return err(
                "unsafe_launch_command",
                "Only URI launch commands are accepted without an executable path.",
                true,
            );
        }
        let result = if cfg!(target_os = "windows") {
            Command::new("cmd")
                .args(["/C", "start", "", launch_command])
                .spawn()
        } else if cfg!(target_os = "macos") {
            Command::new("open").arg(launch_command).spawn()
        } else {
            Command::new("xdg-open").arg(launch_command).spawn()
        };
        return match result {
            Ok(child) => ok(LaunchGameData {
                game_id: request.game_id,
                process_id: Some(child.id()),
                launched_at: now_stamp(),
                source_launcher: request.source_launcher,
            }),
            Err(error) => err("launcher_uri_failed", error.to_string(), true),
        };
    }

    err(
        "launch_target_missing",
        "No executable path or launcher URI is configured for this game.",
        true,
    )
}

#[tauri::command]
fn install_game(request: InstallGameRequest) -> CommandResult<DownloadCommandData> {
    if request.install_path.trim().is_empty() {
        return err("install_path_required", "Choose an install location first.", true);
    }
    let path = PathBuf::from(&request.install_path);
    if let Err(error) = fs::create_dir_all(&path) {
        return err("install_path_unavailable", error.to_string(), true);
    }
    let source = request
        .source_launcher
        .unwrap_or_else(|| "dreamworks".to_string());
    ok(DownloadCommandData {
        task_id: format!("{}:{}:{}", source, request.game_id, now_stamp()),
        game_id: request.game_id,
        status: if request.size_bytes == 0 {
            "queued".to_string()
        } else {
            "downloading".to_string()
        },
        install_path: Some(request.install_path),
    })
}

#[tauri::command]
fn pause_download(task_id: String) -> CommandResult<DownloadCommandData> {
    ok(DownloadCommandData {
        game_id: task_id
            .split(':')
            .nth(1)
            .unwrap_or(task_id.as_str())
            .to_string(),
        task_id,
        status: "paused".to_string(),
        install_path: None,
    })
}

#[tauri::command]
fn resume_download(task_id: String) -> CommandResult<DownloadCommandData> {
    ok(DownloadCommandData {
        game_id: task_id
            .split(':')
            .nth(1)
            .unwrap_or(task_id.as_str())
            .to_string(),
        task_id,
        status: "downloading".to_string(),
        install_path: None,
    })
}

#[tauri::command]
fn verify_install(request: VerifyInstallRequest) -> CommandResult<VerifyInstallData> {
    ok(VerifyInstallData {
        exists: Path::new(&request.install_path).exists(),
        verified_at: now_stamp(),
        install_path: request.install_path,
        game_id: request.game_id,
    })
}

#[tauri::command]
fn move_install(request: MoveInstallRequest) -> CommandResult<MoveInstallData> {
    let from = Path::new(&request.from_path);
    if !from.exists() {
        return err("install_missing", "The current install path does not exist.", true);
    }
    let to = Path::new(&request.to_path);
    if let Some(parent) = to.parent() {
        if let Err(error) = fs::create_dir_all(parent) {
            return err("move_target_unavailable", error.to_string(), true);
        }
    }
    match fs::rename(from, to) {
        Ok(()) => ok(MoveInstallData {
            game_id: request.game_id,
            from_path: request.from_path,
            to_path: request.to_path,
            moved_at: now_stamp(),
        }),
        Err(error) => err("move_failed", error.to_string(), true),
    }
}

fn is_safe_uninstall_path(path: &Path) -> bool {
    let normalized = normalize_path(&path.to_string_lossy());
    normalized.contains("/Dreamworks/")
        || normalized.ends_with("/Dreamworks")
        || normalized.contains("/.dreamworks/")
}

#[tauri::command]
fn uninstall_game(request: UninstallGameRequest) -> CommandResult<UninstallGameData> {
    let path = Path::new(&request.install_path);
    if !path.exists() {
        return ok(UninstallGameData {
            game_id: request.game_id,
            uninstalled_at: now_stamp(),
        });
    }
    if !is_safe_uninstall_path(path) {
        return err(
            "unsafe_uninstall_path",
            "Dreamworks will not delete folders outside a Dreamworks install root.",
            true,
        );
    }
    match fs::remove_dir_all(path) {
        Ok(()) => ok(UninstallGameData {
            game_id: request.game_id,
            uninstalled_at: now_stamp(),
        }),
        Err(error) => err("uninstall_failed", error.to_string(), true),
    }
}

#[tauri::command]
fn open_install_folder(request: OpenInstallFolderRequest) -> CommandResult<OpenFolderData> {
    let path = Path::new(&request.install_path);
    if !path.exists() {
        return err("folder_missing", "The install folder does not exist.", true);
    }
    let result = if cfg!(target_os = "windows") {
        Command::new("explorer").arg(path).spawn()
    } else if cfg!(target_os = "macos") {
        Command::new("open").arg(path).spawn()
    } else {
        Command::new("xdg-open").arg(path).spawn()
    };
    match result {
        Ok(_) => ok(OpenFolderData { opened: true }),
        Err(error) => err("open_folder_failed", error.to_string(), true),
    }
}

#[tauri::command]
fn read_system_capabilities() -> CommandResult<SystemCapabilities> {
    ok(SystemCapabilities {
        os: os_name().to_string(),
        arch: env::consts::ARCH.to_string(),
        home_dir: home_dir().map(|path| path.to_string_lossy().to_string()),
        can_open_folders: true,
        can_spawn_processes: true,
        can_scan_launchers: true,
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HardwareInfo {
    cpu: String,
    ram: String,
    storage: String,
}

#[tauri::command]
fn read_hardware_info() -> CommandResult<HardwareInfo> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpu = sys.cpus().first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown Processor".to_string());
    
    let total_ram_bytes = sys.total_memory();
    let ram_gb = (total_ram_bytes as f64 / 1_073_741_824.0).ceil() as u64;
    let ram = format!("{} GB RAM", ram_gb);
    
    let disks = Disks::new_with_refreshed_list();
    let mut unique_capacities = std::collections::HashSet::new();
    
    for disk in &disks {
        let space = disk.total_space();
        // Ignore partitions smaller than 10GB (recovery/boot)
        if space > 10_000_000_000 {
            unique_capacities.insert(space);
        }
    }
    
    let total_storage_bytes: u64 = unique_capacities.iter().sum();
    
    let mut storage = "Unknown Storage".to_string();
    if total_storage_bytes > 0 {
        let tb = total_storage_bytes as f64 / 1_099_511_627_776.0;
        let gb = total_storage_bytes as f64 / 1_073_741_824.0;
        if tb >= 0.9 {
            storage = format!("{:.1} TB Storage", tb);
        } else {
            storage = format!("{:.0} GB Storage", gb);
        }
    }
    
    ok(HardwareInfo {
        cpu,
        ram,
        storage,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            scan_launchers,
            launch_game,
            install_game,
            pause_download,
            resume_download,
            verify_install,
            move_install,
            uninstall_game,
            open_install_folder,
            read_system_capabilities,
            read_hardware_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
