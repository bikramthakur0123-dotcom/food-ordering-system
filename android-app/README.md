# Biteora Android Wrapper

This Android project wraps the Biteora website in a WebView so it can be installed on Android devices as an APK.

## Important
The app loads the local site at:

http://localhost:8000/

For a real installed app, replace this URL with your hosted public site URL, such as:

https://yourdomain.com

## Build steps

1. Install Android Studio
2. Open the `android-app` folder as a project
3. Let Gradle sync
4. Build > Generate Signed Bundle / APK
5. Install the generated APK on a device

## Note
This project is a wrapper around the existing Biteora web app and uses the same functionality as the website.
