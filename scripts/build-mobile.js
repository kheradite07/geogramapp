const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const apiBackupDir = path.join(__dirname, '..', 'src', 'app', '_api_backup');

// Ensure API dir is restored even on exit
process.on('SIGINT', restoreApi);
process.on('SIGTERM', restoreApi);
// process.on('exit', restoreApi); // 'exit' is synchronous only, handled in finally

function restoreApi() {
    if (fs.existsSync(apiBackupDir)) {
        console.log('Restoring API directory...');
        try {
            // Check if apiDir was somehow recreated or locked
            if (fs.existsSync(apiDir)) {
                // If apiDir exists (maybe partial restore), remove it first? 
                // Or move backup content back?
                // Safest: if original missing, move backup back.
                // If both exist, this is manual intervention state.
            } else {
                fs.renameSync(apiBackupDir, apiDir);
            }
        } catch (e) {
            console.error('Failed to restore API directory:', e);
        }
    }
}

try {
    // Clear next cache to avoid stale type errors
    const nextDir = path.join(__dirname, '..', '.next');
    if (fs.existsSync(nextDir)) {
        console.log('Clearing .next cache...');
        try {
            fs.rmSync(nextDir, { recursive: true, force: true });
        } catch (e) {
            console.warn('Warning: Could not clear .next cache. Dev server might be running. Proceeding anyway...');
        }
    }

    if (fs.existsSync(apiDir)) {
        console.log('Moving API directory for static export...');
        fs.renameSync(apiDir, apiBackupDir);
    } else if (fs.existsSync(apiBackupDir)) {
        console.warn('API directory already moved (found backup). Proceeding...');
    } else {
        console.warn('API directory not found at ' + apiDir + '. Proceeding...');
    }

    console.log('Running mobile build...');

    // Set environment variable for the build process
    const env = { ...process.env, MOBILE_BUILD: 'true' };

    // Run the build command (npm run build -> prisma generate && next build)
    execSync('npm run build', { stdio: 'inherit', env });

} catch (error) {
    console.error('Build execution failed.');
    console.error(error);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    process.exit(1);
} finally {
    restoreApi();
}
