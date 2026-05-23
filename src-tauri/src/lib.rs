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
use tauri::{AppHandle, Emitter};
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

// ── Diagnostics: hardware snapshot ─────────────────────────────────────────

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct CpuInfo {
    brand: String,
    vendor_id: String,
    physical_cores: u32,
    logical_cores: u32,
    base_frequency_mhz: u64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MemoryInfo {
    total_bytes: u64,
    available_bytes: u64,
    used_bytes: u64,
    swap_total_bytes: u64,
    swap_used_bytes: u64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DiskInfo {
    name: String,
    mount_point: String,
    total_bytes: u64,
    available_bytes: u64,
    file_system: String,
    is_removable: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct GpuInfo {
    vendor: String,
    model: String,
    vram_bytes: u64,
    backend: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct OsInfo {
    name: String,
    version: String,
    kernel_version: String,
    hostname: String,
    architecture: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct NetworkAdapter {
    interface_name: String,
    mac_address: String,
    is_loopback: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct HardwareSnapshot {
    captured_at: String,
    schema_version: u32,
    cpu: CpuInfo,
    memory: MemoryInfo,
    disks: Vec<DiskInfo>,
    gpus: Vec<GpuInfo>,
    os: OsInfo,
    network: Vec<NetworkAdapter>,
}

fn build_hardware_snapshot() -> HardwareSnapshot {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpus = sys.cpus();
    let (brand, vendor_id, frequency) = cpus
        .first()
        .map(|c| (c.brand().to_string(), c.vendor_id().to_string(), c.frequency()))
        .unwrap_or_else(|| ("Unknown".to_string(), "".to_string(), 0));
    let logical_cores = cpus.len() as u32;
    let physical_cores = System::physical_core_count().unwrap_or(logical_cores as usize) as u32;

    let cpu = CpuInfo {
        brand,
        vendor_id,
        physical_cores,
        logical_cores,
        base_frequency_mhz: frequency,
    };

    let memory = MemoryInfo {
        total_bytes: sys.total_memory(),
        available_bytes: sys.available_memory(),
        used_bytes: sys.used_memory(),
        swap_total_bytes: sys.total_swap(),
        swap_used_bytes: sys.used_swap(),
    };

    let disks_list = Disks::new_with_refreshed_list();
    let disks: Vec<DiskInfo> = disks_list
        .iter()
        .filter(|d| d.total_space() > 1_000_000_000) // skip <1GB virtual partitions
        .map(|d| DiskInfo {
            name: d.name().to_string_lossy().to_string(),
            mount_point: d.mount_point().to_string_lossy().to_string(),
            total_bytes: d.total_space(),
            available_bytes: d.available_space(),
            file_system: d.file_system().to_string_lossy().to_string(),
            is_removable: d.is_removable(),
        })
        .collect();

    // GPU enumeration without wgpu — best-effort placeholder. On macOS unified
    // memory means total system RAM is the GPU pool too. On Windows / Linux
    // a real backend would query DXGI / Vulkan; we leave a single "Unknown"
    // entry so the UI surface is present.
    let gpu_vendor = if cfg!(target_os = "macos") {
        "Apple"
    } else if cfg!(target_os = "windows") {
        "Unknown (DXGI not queried)"
    } else {
        "Unknown"
    };
    let gpu_backend = if cfg!(target_os = "macos") {
        "metal"
    } else if cfg!(target_os = "windows") {
        "dx12"
    } else {
        "vulkan"
    };
    let gpus = vec![GpuInfo {
        vendor: gpu_vendor.to_string(),
        model: "Integrated graphics (snapshot v1)".to_string(),
        vram_bytes: if cfg!(target_os = "macos") {
            sys.total_memory()
        } else {
            0
        },
        backend: gpu_backend.to_string(),
    }];

    let os = OsInfo {
        name: System::name().unwrap_or_else(|| os_name().to_string()),
        version: System::os_version().unwrap_or_default(),
        kernel_version: System::kernel_version().unwrap_or_default(),
        hostname: System::host_name().unwrap_or_default(),
        architecture: env::consts::ARCH.to_string(),
    };

    let networks_list = Networks::new_with_refreshed_list();
    let network: Vec<NetworkAdapter> = networks_list
        .iter()
        .map(|(name, data)| NetworkAdapter {
            interface_name: name.to_string(),
            mac_address: data.mac_address().to_string(),
            is_loopback: name == "lo" || name.starts_with("lo0"),
        })
        .collect();

    HardwareSnapshot {
        captured_at: now_stamp(),
        schema_version: 1,
        cpu,
        memory,
        disks,
        gpus,
        os,
        network,
    }
}

#[tauri::command]
async fn run_hardware_snapshot() -> CommandResult<HardwareSnapshot> {
    // Run the blocking sysinfo work off the JS thread.
    match tauri::async_runtime::spawn_blocking(build_hardware_snapshot).await {
        Ok(snapshot) => ok(snapshot),
        Err(e) => err("snapshot_join_failed", e.to_string(), true),
    }
}

// ── Diagnostics: resource monitor ──────────────────────────────────────────

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProcessSample {
    pid: u32,
    name: String,
    cpu_percent: f32,
    memory_bytes: u64,
    parent_pid: Option<u32>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ResourceMonitorSample {
    sampled_at: String,
    cpu_global_percent: f32,
    memory_used_bytes: u64,
    memory_total_bytes: u64,
    top_processes: Vec<ProcessSample>,
}

#[derive(Default)]
struct MonitorState {
    handle: Mutex<Option<JoinHandle<()>>>,
}

#[tauri::command]
async fn start_resource_monitor(
    app: AppHandle,
    state: tauri::State<'_, MonitorState>,
) -> CommandResult<()> {
    {
        let guard = state.handle.lock().expect("monitor handle poisoned");
        if guard.is_some() {
            return err("monitor_running", "Resource monitor is already running.", true);
        }
    }

    let app_clone = app.clone();
    let handle = spawn(async move {
        let mut sys = System::new_all();
        let mut first_pass = true;
        loop {
            sys.refresh_cpu_all();
            sys.refresh_memory();
            sys.refresh_processes_specifics(
                ProcessesToUpdate::All,
                true,
                ProcessRefreshKind::everything(),
            );

            // The first sample after a fresh refresh shows 0% per-process CPU
            // — sysinfo computes deltas from refresh to refresh. Skip emit.
            if first_pass {
                first_pass = false;
                sleep(Duration::from_millis(1000)).await;
                continue;
            }

            let mut procs: Vec<ProcessSample> = sys
                .processes()
                .iter()
                .map(|(pid, p)| ProcessSample {
                    pid: pid.as_u32(),
                    name: p.name().to_string_lossy().to_string(),
                    cpu_percent: p.cpu_usage(),
                    memory_bytes: p.memory(),
                    parent_pid: p.parent().map(|p| p.as_u32()),
                })
                .collect();
            procs.sort_by(|a, b| {
                b.cpu_percent
                    .partial_cmp(&a.cpu_percent)
                    .unwrap_or(std::cmp::Ordering::Equal)
            });
            procs.truncate(20);

            let cpu_global = sys.global_cpu_usage();
            let sample = ResourceMonitorSample {
                sampled_at: now_stamp(),
                cpu_global_percent: cpu_global,
                memory_used_bytes: sys.used_memory(),
                memory_total_bytes: sys.total_memory(),
                top_processes: procs,
            };
            let _ = app_clone.emit("resource_monitor:sample", &sample);
            sleep(Duration::from_millis(1000)).await;
        }
    });

    let mut guard = state.handle.lock().expect("monitor handle poisoned");
    *guard = Some(handle);
    ok(())
}

#[tauri::command]
async fn stop_resource_monitor(
    state: tauri::State<'_, MonitorState>,
) -> CommandResult<()> {
    let handle = {
        let mut guard = state.handle.lock().expect("monitor handle poisoned");
        guard.take()
    };
    if let Some(h) = handle {
        h.abort();
    }
    ok(())
}

// ── Diagnostics: launcher scan report ──────────────────────────────────────

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LauncherCounts {
    steam: u32,
    epic: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OrphanedInstall {
    path: String,
    size_bytes: Option<u64>,
    reason: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LauncherScanReport {
    games_found: u32,
    total_install_bytes: u64,
    by_launcher: LauncherCounts,
    orphaned_installs: Vec<OrphanedInstall>,
    scan_duration_ms: u128,
    paths_read: Vec<String>,
    generated_at: String,
}

#[tauri::command]
fn scan_launchers_report(
    request: ScanLaunchersRequest,
) -> CommandResult<LauncherScanReport> {
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

    let mut steam_count: u32 = 0;
    let mut epic_count: u32 = 0;
    let mut total: u64 = 0;
    let mut orphans: Vec<OrphanedInstall> = Vec::new();

    for g in &detected {
        match g.launcher.as_str() {
            "steam" => steam_count += 1,
            "epic" => epic_count += 1,
            _ => {}
        }
        if let Some(b) = g.size_bytes {
            total = total.saturating_add(b);
        }
        if let Some(p) = g.install_path.as_deref() {
            let path = Path::new(p);
            if !path.exists() {
                // Walk up: if the parent (e.g. `steamapps/common/`) is missing
                // too, the whole library is offline — surface a softer reason.
                let parent_missing = path
                    .parent()
                    .map(|parent| !parent.exists())
                    .unwrap_or(true);
                orphans.push(OrphanedInstall {
                    path: p.to_string(),
                    size_bytes: g.size_bytes,
                    reason: if parent_missing {
                        "library_offline".to_string()
                    } else {
                        "missing_manifest".to_string()
                    },
                });
            }
        }
    }

    ok(LauncherScanReport {
        games_found: detected.len() as u32,
        total_install_bytes: total,
        by_launcher: LauncherCounts {
            steam: steam_count,
            epic: epic_count,
        },
        orphaned_installs: orphans,
        scan_duration_ms: started.elapsed().as_millis(),
        paths_read,
        generated_at: now_stamp(),
    })
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
        .manage(MonitorState::default())
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
            read_hardware_info,
            run_hardware_snapshot,
            start_resource_monitor,
            stop_resource_monitor,
            scan_launchers_report
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
