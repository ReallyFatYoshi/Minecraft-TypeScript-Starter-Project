// === CONFIGURABLE VARIABLES

const bpfoldername = 'starterbp';
const rpfoldername = 'starterrp';
const useMinecraftPreview = false; // Whether to target the "Minecraft Preview" version of Minecraft vs. the main store version of Minecraft
const useMinecraftDedicatedServer = false; // Whether to use Bedrock Dedicated Server - see https://www.minecraft.net/download/server/bedrock
const dedicatedServerPath = 'C:/Users/YOUR_USER/projects/bds/'; // if using Bedrock Dedicated Server, where to find the extracted contents of the zip package

// === END CONFIGURABLE VARIABLES

const gulp = require('gulp');
const del = require('del');
const os = require('os');
const archiver = require('archiver');
const fs = require('fs');
const spawn = require('child_process').spawn;
const sourcemaps = require('gulp-sourcemaps');
const gulpEsbuild = require('gulp-esbuild');

const worldsFolderName = useMinecraftDedicatedServer ? 'worlds' : 'minecraftWorlds';

const activeWorldFolderName = useMinecraftDedicatedServer ? 'Bedrock level' : bpfoldername + 'world';

const mcdir = useMinecraftDedicatedServer
  ? dedicatedServerPath
  : os.homedir() +
    (useMinecraftPreview
      ? '/AppData/Local/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/'
      : '/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/');

function clean_build(callbackFunction) {
  del(['build/behavior_packs/', 'build/resource_packs/']).then(
    (value) => {
      callbackFunction(); // success
    },
    (reason) => {
      callbackFunction(); // error
    }
  );
}

function copy_behavior_packs() {
  return gulp.src(['behavior_packs/**/*']).pipe(gulp.dest('build/behavior_packs'));
}

function copy_resource_packs() {
  return gulp.src(['resource_packs/**/*']).pipe(gulp.dest('build/resource_packs'));
}

const copy_content = gulp.parallel(copy_behavior_packs, copy_resource_packs);

function compile_scripts() {
  return gulp
    .src('scripts/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(
      gulpEsbuild({
        target: 'es2020',
        platform: 'neutral',
        bundle: true,
        minify: true,
        minifyWhitespace: true,
        minifySyntax: true,
        footer: {
          js: "// Minecraft TypeScript Starter Project\n// This project makes use of Minecraft TypeScript Starter Template\n// Github: https://github.com/ReallyFatYoshi/Minecraft-TypeScript-Starter-Project"
        },
        external: [
          '@minecraft/server',
          '@minecraft/server-ui',
          '@minecraft/vanilla-data',
          '@minecraft/server-gametest',
          '@minecraft/server-admin',
          '@minecraft/server-net',
          '@minecraft/server-editor',
        ],
        loader: {
          '.json': 'json',
          '.ts': 'ts',
          '.js': 'js',
        },
      })
    )
    .pipe(
      sourcemaps.write('../../_' + bpfoldername + 'Debug', {
        destPath: bpfoldername + '/scripts/',
        sourceRoot: './../../../scripts/',
      })
    )
    .pipe(gulp.dest('build/behavior_packs/' + bpfoldername + '/scripts'));
}

function package_packs(callbackFunction) {
  const bpack = archiver('zip', {
    zlib: { level: 9 }
  });
  const rpack = archiver('zip', {
    zlib: { level: 9 }
  });

  if (!fs.existsSync(__dirname + '/dist'))
  {
    fs.mkdirSync(__dirname + '/dist');
  }

  bpack.glob(`build/behavior_packs/${bpfoldername}/*`,
  {
    cwd: __dirname
  })
  rpack.glob(`build/resource_packs/${bpfoldername}/*`,
  {
    cwd: __dirname
  })

  bpack.pipe(fs.createWriteStream(__dirname + '/dist/' + bpfoldername + '.zip'));
  rpack.pipe(fs.createWriteStream(__dirname + '/dist/' + rpfoldername + '.zip'));

  bpack.finalize();
  rpack.finalize();

  callbackFunction(); 
}

const build = gulp.series(clean_build, copy_content, compile_scripts);
const package = gulp.series(build, package_packs);

function clean_localmc(callbackFunction) {
  if (!bpfoldername || !bpfoldername.length || bpfoldername.length < 2) {
    console.log('No bpfoldername specified.');
    callbackFunction();
    return;
  }

  del([mcdir + 'development_behavior_packs/' + bpfoldername, mcdir + 'development_resource_packs/' + rpfoldername], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function deploy_localmc_behavior_packs() {
  console.log("Deploying to '" + mcdir + 'development_behavior_packs/' + bpfoldername + "'");
  return gulp
    .src(['build/behavior_packs/' + bpfoldername + '/**/*'])
    .pipe(gulp.dest(mcdir + 'development_behavior_packs/' + bpfoldername));
}

function deploy_localmc_resource_packs() {
  console.log("Deploying to '" + mcdir + 'development_resource_packs/' + rpfoldername + "'");
  return gulp
    .src(['build/resource_packs/' + rpfoldername + '/**/*'])
    .pipe(gulp.dest(mcdir + 'development_resource_packs/' + rpfoldername));
}

function getTargetWorldPath() {
  return mcdir + worldsFolderName + '/' + activeWorldFolderName;
}

function getTargetConfigPath() {
  return mcdir + 'config';
}

function getTargetWorldBackupPath() {
  return 'backups/worlds/' + activeWorldFolderName;
}

function getDevConfigPath() {
  return 'config';
}

function getDevWorldPath() {
  return 'worlds/default';
}

function getDevWorldBackupPath() {
  return 'backups/worlds/devdefault';
}

function clean_localmc_world(callbackFunction) {
  console.log("Removing '" + getTargetWorldPath() + "'");

  del([getTargetWorldPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_localmc_config(callbackFunction) {
  console.log("Removing '" + getTargetConfigPath() + "'");

  del([getTargetConfigPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_dev_world(callbackFunction) {
  console.log("Removing '" + getDevWorldPath() + "'");

  del([getDevWorldPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_localmc_world_backup(callbackFunction) {
  console.log("Removing backup'" + getTargetWorldBackupPath() + "'");

  del([getTargetWorldBackupPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function clean_dev_world_backup(callbackFunction) {
  console.log("Removing backup'" + getDevWorldBackupPath() + "'");

  del([getTargetWorldBackupPath()], {
    force: true,
  }).then(
    (value) => {
      callbackFunction(); // Success
    },
    (reason) => {
      callbackFunction(); // Error
    }
  );
}

function backup_dev_world() {
  console.log("Copying world '" + getDevWorldPath() + "' to '" + getDevWorldBackupPath() + "'");
  return gulp
    .src([getTargetWorldPath() + '/**/*'])
    .pipe(gulp.dest(getDevWorldBackupPath() + '/worlds/' + activeWorldFolderName));
}

function deploy_localmc_config() {
  console.log("Copying world 'config/' to '" + getTargetConfigPath() + "'");
  return gulp.src([getDevConfigPath() + '/**/*']).pipe(gulp.dest(getTargetConfigPath()));
}

function deploy_localmc_world() {
  console.log("Copying world 'worlds/default/' to '" + getTargetWorldPath() + "'");
  return gulp.src([getDevWorldPath() + '/**/*']).pipe(gulp.dest(getTargetWorldPath()));
}

function ingest_localmc_world() {
  console.log("Ingesting world '" + getTargetWorldPath() + "' to '" + getDevWorldPath() + "'");
  return gulp.src([getTargetWorldPath() + '/**/*']).pipe(gulp.dest(getDevWorldPath()));
}

function backup_localmc_world() {
  console.log("Copying world '" + getTargetWorldPath() + "' to '" + getTargetWorldBackupPath() + "/'");
  return gulp
    .src([getTargetWorldPath() + '/**/*'])
    .pipe(gulp.dest(getTargetWorldBackupPath() + '/' + activeWorldFolderName));
}

const deploy_localmc = gulp.series(
  clean_localmc,
  function (callbackFunction) {
    callbackFunction();
  },
  gulp.parallel(deploy_localmc_behavior_packs, deploy_localmc_resource_packs)
);

function watch() {
  return gulp.watch(
    ['scripts/**/*.ts', 'behavior_packs/**/*', 'resource_packs/**/*'],
    gulp.series(build, deploy_localmc)
  );
}

function serve() {
  return gulp.watch(
    ['scripts/**/*.ts', 'behavior_packs/**/*', 'resource_packs/**/*'],
    gulp.series(stopServer, build, deploy_localmc, startServer)
  );
}

let activeServer = null;

function stopServer(callbackFunction) {
  if (activeServer) {
    activeServer.stdin.write('stop\n');
    activeServer = null;
  }

  callbackFunction();
}

function startServer(callbackFunction) {
  if (activeServer) {
    activeServer.stdin.write('stop\n');
    activeServer = null;
  }

  activeServer = spawn(dedicatedServerPath + 'bedrock_server');

  let logBuffer = '';

  let serverLogger = function (buffer) {
    let incomingBuffer = buffer.toString();

    if (incomingBuffer.endsWith('\n')) {
      (logBuffer + incomingBuffer).split(/\n/).forEach(function (message) {
        if (message) {
          if (message.indexOf('Server started.') >= 0) {
            activeServer.stdin.write('script debugger listen 19144\n');
          }
          console.log('Server: ' + message);
        }
      });
      logBuffer = '';
    } else {
      logBuffer += incomingBuffer;
    }
  };

  activeServer.stdout.on('data', serverLogger);
  activeServer.stderr.on('data', serverLogger);

  callbackFunction();
}

exports.clean_build = clean_build;
exports.copy_behavior_packs = copy_behavior_packs;
exports.copy_resource_packs = copy_resource_packs;
exports.compile_scripts = compile_scripts;
exports.copy_content = copy_content;
exports.build = build;
exports.package = package;
exports.clean_localmc = clean_localmc;
exports.deploy_localmc = deploy_localmc;
exports.default = gulp.series(build, deploy_localmc);
exports.clean = gulp.series(clean_build, clean_localmc);
exports.watch = gulp.series(build, deploy_localmc, watch);
exports.serve = gulp.series(build, deploy_localmc, startServer, serve);
exports.updateworld = gulp.series(
  clean_localmc_world_backup,
  backup_localmc_world,
  clean_localmc_world,
  deploy_localmc_world
);
exports.ingestworld = gulp.series(clean_dev_world_backup, backup_dev_world, clean_dev_world, ingest_localmc_world);
exports.updateconfig = gulp.series(clean_localmc_config, deploy_localmc_config);
