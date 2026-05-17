import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
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
    let delegate = ReactNativeDelegate()
    let factoryInstance = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    // bindReactNativeFactory(_:) populates ExpoAppDelegate's `factory`
    // property — required for ExpoReactDelegate.recreateRootView() to
    // resolve our RCTReactNativeFactory at runtime.
    self.bindReactNativeFactory(factoryInstance)

    window = UIWindow(frame: UIScreen.main.bounds)

    factoryInstance.startReactNative(
      withModuleName: "MirrorCollectiveApp",
      in: window,
      launchOptions: launchOptions
    )

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
