Pod::Spec.new do |s|
  s.name           = 'PulseMultipeer'
  s.version        = '1.0.0'
  s.summary        = 'Offline device-to-device Pulse transport (MultipeerConnectivity)'
  s.description    = 'Sends signed Loadit Pulse notes phone-to-phone over Bluetooth + peer Wi-Fi, fully offline.'
  s.author         = 'Loadit'
  s.homepage       = 'https://loadit.net'
  s.platforms      = { :ios => '13.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
