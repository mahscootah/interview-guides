import {findProblems} from './validation.js';
import {guideFileName} from './fileName.js';

/**
 * Save picks → build .docx → upload → append attachment → add it to the requisition. If saving
 * picks, uploading or attaching fails, the bytes are returned so the UI can offer a download
 * instead. A failed requisition update only adds a warning: the guide itself is attached.
 */
export async function generateGuide({input, deps}) {
  const {header, panelists, selections, existingFiles, generatedAt} = input;
  const problems = findProblems({panelists, selections, brandKey: header.brandKey});
  if (problems.length) return {status: 'invalid', problems};

  const filename = guideFileName(header.positionTitle, header.round, generatedAt);
  const saveError = await deps.savePicks({panelists, selections}).then(() => null, (err) => err);
  const bytes = await deps.buildDocx({header, panelists, selections});
  if (saveError) {
    return {status: 'download', filename, bytes, error: `Your picks were not saved (${saveError.message})`};
  }
  let url;
  try {
    url = await deps.upload(bytes, filename);
    await deps.saveGenerated([...existingFiles, {url, filename}]);
  } catch (err) {
    return {status: 'download', filename, bytes, error: err.message};
  }
  try {
    await deps.saveToRequisition({url, filename});
    return {status: 'attached', filename, bytes};
  } catch (err) {
    return {status: 'attached', filename, bytes, warning: `It wasn't added to the requisition's Panel Interview Guide (${err.message}).`};
  }
}
