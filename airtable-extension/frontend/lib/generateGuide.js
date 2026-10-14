import {findProblems} from './validation.js';
import {guideFileName} from './fileName.js';

/**
 * Save picks → build .docx → upload → append attachment. If saving picks, uploading or
 * attaching fails, the bytes are returned so the UI can offer a download instead.
 */
export async function generateGuide({input, deps}) {
  const {header, panelists, selections, existingFiles} = input;
  const problems = findProblems({panelists, selections, brandKey: header.brandKey});
  if (problems.length) return {status: 'invalid', problems};

  const filename = guideFileName(header.positionTitle, header.round);
  const saveError = await deps.savePicks({panelists, selections}).then(() => null, (err) => err);
  const bytes = await deps.buildDocx({header, panelists, selections});
  if (saveError) {
    return {status: 'download', filename, bytes, error: `Your picks were not saved (${saveError.message})`};
  }
  try {
    const url = await deps.upload(bytes, filename);
    await deps.saveGenerated([...existingFiles, {url, filename}]);
    return {status: 'attached', filename};
  } catch (err) {
    return {status: 'download', filename, bytes, error: err.message};
  }
}
