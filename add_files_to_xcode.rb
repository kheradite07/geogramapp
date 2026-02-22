require 'xcodeproj'

project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |target| target.name == 'App' }
app_group = project.main_group.find_subpath(File.join('App'), true)

file_names = ['InstagramStoriesPlugin.swift', 'InstagramStoriesPlugin.m']

file_names.each do |file_name|
  # 1. Add reference to the group if it doesn't exist
  file_ref = app_group.files.find { |f| f.path == file_name }
  if file_ref.nil?
    file_ref = app_group.new_reference(file_name)
    puts "Created file reference for #{file_name}"
  end
  
  # 2. Add to Compile Sources Build Phase so it gets compiled
  build_phase = app_target.source_build_phase
  if build_phase.files_references.include?(file_ref)
    puts "#{file_name} is already in the Compile Sources build phase."
  else
    build_phase.add_file_reference(file_ref)
    puts "Added #{file_name} to the Compile Sources build phase."
  end
end

project.save
puts "Successfully saved Xcode project."
