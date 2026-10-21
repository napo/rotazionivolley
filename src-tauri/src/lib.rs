#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    // External links (GitHub, PayPal donation): the webview doesn't open
    // target="_blank" links, so web/src/ExternalLink.tsx hands them to the
    // system browser through this plugin.
    .plugin(tauri_plugin_opener::init())
    // Automatic updates (checked and installed only after the user confirms
    // in the app, see web/src/update) — desktop only, the updater plugin
    // doesn't support mobile.
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
