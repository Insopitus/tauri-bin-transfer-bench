// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, io, sync::Mutex, time::Instant};

// mod base64;
use base64::{engine::general_purpose, Engine as _};

#[derive(serde::Deserialize, serde::Serialize)]
struct FileData(Mutex<Vec<u8>>);

#[tauri::command]
fn init_data(url: &str, state: tauri::State<FileData>) {
    let mut data = state.0.lock().unwrap();
    *data = fs::read(url).unwrap();
}

#[tauri::command]
fn read_and_send_via_base64(url: &str) -> String {
    let data = fs::read(url).unwrap();
    general_purpose::STANDARD.encode(data)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn transfer_via_base64(state: tauri::State<FileData>) -> Result<String, String> {
    let data = state.0.lock().map_err(|e| e.to_string())?.to_vec();
    let encoded: String = general_purpose::STANDARD_NO_PAD.encode(data);
    Ok(encoded)
}

/// the default behavior tauri uses to transfer binary data is to serialize the data to json number arrays and deserialize
/// it to a javascript number array then convert it to javascript uint8array
#[tauri::command]
fn transfer_via_json(state: tauri::State<FileData>) -> Result<Vec<u8>, String> {
    let data = state.0.lock().map_err(|e| e.to_string())?;
    Ok(data.to_vec())
}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_data,
            transfer_via_base64,
            transfer_via_json,
            read_and_send_via_base64
        ])
        .manage(FileData(Mutex::new(vec![])))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
