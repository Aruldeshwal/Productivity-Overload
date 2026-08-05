import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * Checks and requests OS permission for native desktop notifications.
 * Safe to call on app startup or inside component hooks.
 */
export async function setupNotificationPermissions(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    return granted;
  } catch (err) {
    console.warn("Failed to query or request notification permission:", err);
    return false;
  }
}

/**
 * Triggers a native desktop notification if permission has been granted.
 */
export async function notifyUser(title: string, body: string): Promise<boolean> {
  try {
    const granted = await setupNotificationPermissions();
    if (granted) {
      sendNotification({
        title,
        body,
      });
      return true;
    } else {
      console.warn("Notification suppressed: permission not granted.");
      return false;
    }
  } catch (err) {
    console.error("Error firing native desktop notification:", err);
    return false;
  }
}
