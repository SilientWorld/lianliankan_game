# SPDX-License-Identifier: MIT

{
  description = "Nix Building Environment for React Native";

  inputs = {
    flake-utils = {
      url = "github:numtide/flake-utils";
    };
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, flake-utils, flake-compat }:
    flake-utils.lib.eachDefaultSystem ( system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
            android_sdk = {
              accept_license = true;
            };
          };
        };
        buildToolsVersion = "35.0.0";
        androidComposition = pkgs.androidenv.composeAndroidPackages {
          buildToolsVersions = [ buildToolsVersion "34.0.0" ];
          platformVersions = [ "35" "34" ];
          abiVersions = [ "x86_64" "arm64-v8a" ];
          cmakeVersions = [ "3.22.1" ];
          includeNDK = true;
          useGoogleAPIs = false;
          useGoogleTVAddOns = false;
          includeEmulator = false;
          includeSystemImages = false;
          includeSources = false;
        };
        pinnedJDK = pkgs.jdk21;
        androidSdk = androidComposition.androidsdk;
      in {
        devShells = {
          default = pkgs.mkShell {
            name = "LianLianKan-Build-Shell";
            buildInputs = with pkgs; [
              nodejs_18
              yarn
            ] ++ [
              androidSdk
              pinnedJDK
            ];
            JAVA_HOME = pinnedJDK;
            ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
            NDK_HOME = "${androidSdk}/libexec/android-sdk/ndk/27.0.12077973";
            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidSdk}/libexec/android-sdk/build-tools/${buildToolsVersion}/aapt2";

          };
        };
      }
    );
}