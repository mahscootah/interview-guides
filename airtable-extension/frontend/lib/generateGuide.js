import {findProblems} from './validation.js';
import {guideFileName} from './fileName.js';

/**
 * Save picks → build .docx → upload → append attachment. Any failure after the build
 * returns the bytes so the UI can offer a download instead.
 */
export async function generateGuide({input, deps}) {
  const {header, panelists, selections, existingFiles} = input;
  const problems = findProblems({panelists, selections, brandKey: header.brandKey});
  if (problems.length) return {status: 'invalid', problems};

  const filename = guideFileName(header.positionTitle, header.round);
  await deps.savePicks({panelists, selections});
  const bytes = await deps.buildDocx({header, panelists, selections});
  try {
    const url = await deps.upload(bytes, filename);
    await deps.saveGenerated([...existingFiles, {url, filename}]);
    return {status: 'attached', filename};
  } catch (err) {
    return {status: 'download', filename, bytes, error: err.message};
  }
}
