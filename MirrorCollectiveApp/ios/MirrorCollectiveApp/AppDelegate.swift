import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import AVFoundation
// Expo modules autolinking. ExpoReactNativeFactory subclasses
// RCTReactNativeFactory and is the seam where ExpoModulesCore installs
// its JSI globals (globalThis.expo.NativeModule etc) at app launch.
// Without this swap, expo-modules-core throws "cannot read property
// nativemodule of globalThis.expo" at the first requireNativeModule()
// call — which expo-image hits the moment a <CachedImage> mounts.
//
// AppDelegate ALSO needs to inherit from ExpoAppDelegate so it can act
// as a `ReactNativeFactoryProvider` (KVC-introspected by
// ExpoReactDelegate.createReactRootView). Without that inheritance,
// the runtime KVC probe (`valueForKey: "_expoAppDelegate"`) throws
// NSUndefinedKeyException → SIGABRT immediately after launch.
import Expo

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    // Prime the shared AVAudioSession to a record-capable category at launch.
    // react-native-audio-recorder-player v4 configures .playAndRecord inside
    // startRecorder(), but on a cold start (before any Vision Camera / video
    // component has claimed the session) that first activation intermittently
    // fails on iOS/iPadOS — recording then reports "microphone unavailable"
    // until video recording is opened once (which warms the session). Setting
    // the category here establishes a recordable session from launch so the
    // very first voice recording works. .mixWithOthers avoids interrupting any
    // playing audio; .defaultToSpeaker keeps playback on the main speaker.
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(
        .playAndRecord,
        mode: .default,
        options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers]
      )
      try session.setActive(true)
    } catch {
      print("AVAudioSession setup at launch failed: \(error)")
    }

    let delegate = ReactNativeDelegate()
    let factoryInstance = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    // bindReactNativeFactory(_:) populates ExpoAppDelegate's `factory`
    // property — required for ExpoReactDelegate.recreateRootView() to
    // resolve our RCTReactNativeFactory at runtime.
    self.bindReactNativeFactory(factoryInstance)

    window = UIWindow(frame: UIScreen.main.bounds)

    // Dark ground behind the whole RN surface. During a native-stack push the
    // transition animates ABOVE the JS NavigationContainer background, so the
    // incoming card's rounded corner briefly exposes the native UIWindow. With
    // no explicit color the window defaults to a light/system fill, which
    // flashed as a pale/gold sliver at the right corner on every transition.
    // Anchor it to the app's darkest ramp stop (#080911 == navTheme.card) so any
    // reveal reads as shadow, not a seam. `contentStyle` on the navigator paints
    // the JS scene; this covers the native layer the JS tree can't reach.
    let groundColor = UIColor(
      red: 8.0 / 255.0,
      green: 9.0 / 255.0,
      blue: 17.0 / 255.0,
      alpha: 1.0
    )
    window?.backgroundColor = groundColor

    factoryInstance.startReactNative(
      withModuleName: "MirrorCollectiveApp",
      in: window,
      launchOptions: launchOptions
    )

    // The RN root view controller's view sits behind the navigator too; paint it
    // the same ground so nothing light shows through at the transition seam.
    window?.rootViewController?.view.backgroundColor = groundColor

    return true
  }
}

// ExpoReactNativeFactoryDelegate extends RCTDefaultReactNativeFactoryDelegate
// and adds the Expo-side hooks (extraModules, react-delegate bridging) that
// ExpoReactNativeFactory checks for at runtime via `as?` — a cast that
// fatalErrors if you keep the old base class.
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
