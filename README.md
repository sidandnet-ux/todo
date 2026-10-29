# Calendar Tasks PWA

A calendar-layout to-do list for GitHub Pages. Tasks are saved locally in the browser on this device. No account, server, or database is required.

## Features
- Monthly calendar with previous/next month and Today navigation
- Select a day to see its tasks
- Add tasks with an optional time; edit or delete tasks
- Mark tasks complete **and unmark them** at any time
- Daily completion progress and calendar task indicators
- Local-only storage using `localStorage`
- Offline app shell through a service worker
- Responsive layout for Android phones and desktop browsers

## Publish on GitHub Pages
1. Download and extract this ZIP.
2. Open your GitHub repository (for example, the existing `plog` repository).
3. Upload the files and folders from inside `calendar-todo-pwa` to the repository root. Keep the `icons` folder and its three PNG files.
4. Commit the changes.
5. In **Settings → Pages**, select the branch and root (`/`) if GitHub Pages is not already enabled.
6. Wait for the Pages deployment to finish, then open your site over HTTPS.

If replacing an existing app, download a backup of the old files first. Do not upload the ZIP itself as the website; extract it and upload its contents.

## Install on Android
1. Open the GitHub Pages URL in Chrome.
2. Visit the page once while online and wait a few seconds for the service worker to install.
3. Open Chrome's menu (⋮) and choose **Install app** or **Add to Home screen** if offered.
4. Launch it from the new home-screen icon. Open it once online before using offline.

## Test locally
Service workers generally require HTTPS or `localhost`; opening `index.html` directly as a `file://` URL will not enable offline/PWA installation. You can use GitHub Pages for testing or run a local HTTP server.

## Backup and restore
- Tap **Backup / Restore** in the app.
- Choose **Download backup** to save a JSON file containing all tasks, dates, optional times, completion state and creation timestamps.
- To restore, tap **Choose backup file** and select a JSON backup created by this app.
- Restore replaces the current task list on this device after a confirmation prompt. If you need both sets of tasks, download a backup of the current tasks before restoring.
- Keep the backup file in a safe place; it contains your task information.

## Data and privacy
Tasks are stored in the browser's local storage on the device and browser profile you use. They do not automatically sync to another device. Clearing site data or browser storage may erase them, so keep your own backup if the tasks are important.
