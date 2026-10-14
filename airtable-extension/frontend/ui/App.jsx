import React, {useEffect, useMemo, useState} from 'react';
import {useBase, useRecords, useSearchParams, useSession} from '@airtable/blocks/interface/ui';
import {TABLES, readRequisition, readGuide, newGuideFields, savePicksFields, generatedFields} from '../lib/airtableData.js';
import {parseSelections, serializeSelections} from '../lib/selections.js';
import {initialPanelists, formatPanelists} from '../lib/panelists.js';
import {buildGuideDocx} from '../lib/docBuilder.js';
import {createFileDropClient} from '../lib/fileDropClient.js';
import {generateGuide} from '../lib/generateGuide.js';
import {FILE_DROP_URL} from '../config.js';
import {StartScreen} from './StartScreen.jsx';
import {BuilderScreen} from './BuilderScreen.jsx';

const fileDrop = createFileDropClient({baseUrl: FILE_DROP_URL});

function MissingSetup({what}) {
  return <p className="problems">The Guide Builder can't find {what}. Ask Scott to check the extension setup.</p>;
}

export function App() {
  const base = useBase();
  const session = useSession();
  const reqTable = base.getTableByNameIfExists(TABLES.requisitions);
  const guideTable = base.getTableByNameIfExists(TABLES.guides);
  const reqRecords = useRecords(reqTable);
  const guideRecords = useRecords(guideTable);
  const {searchParams, setSearchParamsAsync} = useSearchParams();
  const [notice, setNotice] = useState(null);

  useEffect(() => { fileDrop.wake(); }, []);

  const requisitions = useMemo(() => (reqRecords ?? []).map(readRequisition), [reqRecords]);
  const reqById = useMemo(() => new Map(requisitions.map((r) => [r.id, r])), [requisitions]);
  const guides = useMemo(() => (guideRecords ?? []).map(readGuide), [guideRecords]);
  const guideRows = guides.map((g) => ({...g, positionTitle: reqById.get(g.requisitionId)?.positionTitle ?? '', reqNumber: reqById.get(g.requisitionId)?.reqNumber ?? ''}));
  const guide = searchParams.guide ? guides.find((g) => g.id === searchParams.guide) ?? null : null;
  const guideMissing = Boolean(searchParams.guide && guideRecords && !guide);

  useEffect(() => {
    if (!guideMissing) return;
    setNotice('That guide no longer exists.');
    setSearchParamsAsync({});
  }, [guideMissing, setSearchParamsAsync]);

  if (!reqTable) return <MissingSetup what={`the "${TABLES.requisitions}" table`} />;
  if (!guideTable) return <MissingSetup what={`the "${TABLES.guides}" table`} />;

  const openGuide = (id) => { setNotice(null); setSearchParamsAsync({guide: id}); };
  const backToStart = () => setSearchParamsAsync({});
  const createGuide = async ({requisitionId, round, name}) => {
    const id = await guideTable.createRecordAsync(newGuideFields({name, requisitionId, round}));
    openGuide(id);
  };

  if (!guide) {
    return <StartScreen requisitions={requisitions} guides={guideRows} notice={notice} onCreate={createGuide} onOpen={openGuide} />;
  }

  const requisition = reqById.get(guide.requisitionId);
  if (!requisition) return <BackWithMessage onBack={backToStart} text="This guide isn't linked to a requisition. Link one in the record, then reopen it." />;
  if (!requisition.positionTitle) return <BackWithMessage onBack={backToStart} text="The linked requisition has no Position Title. Add one in Master Tracker, then reopen this guide." />;

  const {selections, warning} = parseSelections(guide.selectionsText);
  const savePicks = ({panelists: p, selections: s}) => guideTable.updateRecordAsync(guide.id, savePicksFields({panelistsText: formatPanelists(p), selectionsText: serializeSelections(s)}));
  const onGenerate = ({panelists, selections: picks, brandKey}) => generateGuide({
    input: {header: {...requisition, round: guide.round, brandKey}, panelists, selections: picks, existingFiles: guide.files},
    deps: {
      savePicks,
      buildDocx: buildGuideDocx,
      upload: fileDrop.upload,
      saveGenerated: (files) => guideTable.updateRecordAsync(guide.id, generatedFields({files, userId: session.currentUser.id, at: new Date()})),
    },
  });

  return (
    <BuilderScreen key={guide.id} requisition={requisition} guide={guide}
      initialPanelists={initialPanelists(guide.panelistsText, requisition.panelistCount)}
      initialSelections={selections} warning={warning} onBack={backToStart} onSave={savePicks} onGenerate={onGenerate} />
  );
}

function BackWithMessage({onBack, text}) {
  return (
    <div>
      <button type="button" onClick={onBack}>← Back to guides</button>
      <p className="problems">{text}</p>
    </div>
  );
}
