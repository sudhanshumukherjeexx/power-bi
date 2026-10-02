/* assets/js/tracks.js (TRACKS: Skill Mode tracks such as SQL, Testing, Fabric; TRACK_DATA: their files)
   and assets/js/solutions-tracks.js (TRACK_SOLUTIONS, merged into SOLUTIONS by solutions.js). */
'use strict';
module.exports = (all, { BANNER, list, map, J, moduleOut, tsol }) => {
  const tracks = all.modules.filter(m => m.kind === 'track');
  return {
    'assets/js/tracks.js': BANNER('content/skills/<track>/ and content/datasets/tracks.json') +
      `/* TRACKS = Skill Mode tracks (same shape as LEVELS). TRACK_DATA = downloadable files the track topics use. */\n` +
      list('TRACKS', tracks.map(moduleOut)) +
      `const TRACK_DATA=${J(Object.fromEntries((all.trackDatasets || []).map(d => [d.key, { name: d.name, desc: d.desc, file: d.file, rows: d.rows || null }])))};\n`,
    'assets/js/solutions-tracks.js': BANNER('content/solutions (track topics)') + map('TRACK_SOLUTIONS', tsol)
  };
};
