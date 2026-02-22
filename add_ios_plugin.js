const xcode = require('xcode');
const fs = require('fs');
const path = require('path');

const projectPath = path.join(__dirname, 'ios/App/App.xcodeproj/project.pbxproj');
const myProj = xcode.project(projectPath);

myProj.parse(function (err) {
    if (err) {
        console.error('Error parsing project:', err);
        process.exit(1);
    }

    const swiftFilePath = '"App/InstagramStoriesPlugin.swift"'; // Path relative to iOS group 'App'
    const mFilePath = '"App/InstagramStoriesPlugin.m"';

    const swiftFile = path.join(__dirname, 'ios/App/App/InstagramStoriesPlugin.swift');
    const mFile = path.join(__dirname, 'ios/App/App/InstagramStoriesPlugin.m');

    // Add source files
    myProj.addSourceFile(swiftFile, { target: myProj.getFirstTarget().uuid });
    myProj.addSourceFile(mFile, { target: myProj.getFirstTarget().uuid });

    // Write the resulting project back to the file system
    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('Successfully added InstagramStoriesPlugin files to Xcode project.');
});
