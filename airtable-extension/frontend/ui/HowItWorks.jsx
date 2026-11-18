import React from 'react';

export function HowItWorks() {
  return (
    <details className="card help" open>
      <summary>How the Guide Builder works</summary>
      <p className="muted">
        Build a branded Word panel interview guide from the TA question bank. The finished guide is
        saved to the requisition, so there's nothing to upload by hand.
      </p>
      <ol>
        <li>
          <strong>Find the requisition.</strong> Search by position title or Req #. Open requisitions
          where you're the Recruiter or CES are listed first and marked <span className="tag">Yours</span>.
        </li>
        <li>
          <strong>Create the guide.</strong> Pick the interview round (Panel, Second Panel, Final or Other).
          The guide name fills in for you; change it if you like.
        </li>
        <li>
          <strong>Choose competencies.</strong> Check the competencies the recruiter entered in Workday.
        </li>
        <li>
          <strong>Add panelists and pick questions.</strong> Copy the panelist names from Workday. For each
          competency, pick the questions to ask and the panelist who will ask them. If the hiring manager
          asked for specific questions, add them under "Add a hiring-manager question".
        </li>
        <li>
          <strong>Generate.</strong> Check the brand template, then click <em>Generate guide</em>. The Word
          file is attached to the guide and to the requisition's Panel Interview Guide field.
        </li>
      </ol>
      <h3>Good to know</h3>
      <ul>
        <li>
          Your picks are saved when you generate or click <em>← Back to guides</em>. Closing the tab
          loses unsaved picks. Reopen any guide from Recent guides to pick up where you left off.
        </li>
        <li>
          Generating again for the same round replaces the builder's earlier file on the requisition.
          Files uploaded by hand are never removed, and the guide record keeps every version.
        </li>
        <li>
          The first Generate after a quiet spell can take about a minute. If the file can't be attached,
          you'll get a <em>Download .docx</em> button instead.
        </li>
        <li><em>Copy questions</em> copies the picked questions so you can paste them into an email or Teams.</li>
        <li>A question is wrong or missing? Let TA Operations know; the question bank is kept in Airtable.</li>
      </ul>
    </details>
  );
}
