Pod::Spec.new do |s|
  s.name           = 'PulseBle'
  s.version        = '1.0.0'
  s.summary        = 'Cross-platform BLE peripheral for offline Pulse payments'
  s.description    = 'Advertises the Loadit service + @handle and runs a GATT server that receives signed Pulse notes over Bluetooth.'
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
