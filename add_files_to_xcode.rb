require 'xcodeproj'
project_path = 'ios/App/App.xcodeproj'
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |target| target.name == 'App' }
app_group = project.main_group.find_subpath(File.join('App'), true)

file_refs = []
['InstagramStoriesPlugin.swift', 'InstagramStoriesPlugin.m'].each do |file_name|
  file_path = File.join('ios/App/App', file_name)
  unless app_group.find_file_by_path(file_name)
    file_ref = app_group.new_reference(file_name)
    app_target.add_file_references([file_ref])
    puts "Added #{file_name} to Xcode project."
  else
    puts "#{file_name} already exists in Xcode project."
  end
end

project.save
