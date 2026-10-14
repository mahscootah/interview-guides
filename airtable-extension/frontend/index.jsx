import React from 'react';
import {initializeBlock, loadCSSFromString} from '@airtable/blocks/interface/ui';
import {App} from './ui/App.jsx';
import {CSS} from './ui/styles.js';

loadCSSFromString(CSS);

initializeBlock({interface: () => <div className="gb"><App /></div>});
