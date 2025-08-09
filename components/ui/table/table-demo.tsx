/**
 * Table System Demonstration
 * Shows the new robust table system with different variants including wide tables
 */

import React from 'react';
import {
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  CompleteTable,
  WideTable,
  WideColumnDefinition,
} from './table';

export function TableDemo() {
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Robust Table System Demo</h1>
      
      {/* Default Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Default Table</h2>
        <CompleteTable variant="default" striped>
          <TableHead>
            <TableRow>
              <TableHeader>Emotion</TableHeader>
              <TableHeader columnType="priority">Rating</TableHeader>
              <TableHeader>Description</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell label="Emotion">Anxiety</TableCell>
              <TableCell label="Rating" columnType="priority">8/10</TableCell>
              <TableCell label="Description">Feeling worried about presentation</TableCell>
            </TableRow>
            <TableRow>
              <TableCell label="Emotion">Joy</TableCell>
              <TableCell label="Rating" columnType="priority">6/10</TableCell>
              <TableCell label="Description">Happy about weekend plans</TableCell>
            </TableRow>
          </TableBody>
        </CompleteTable>
      </section>

      {/* CBT Report Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4">CBT Report Table</h2>
        <CompleteTable variant="cbt-report" striped>
          <TableHead>
            <TableRow>
              <TableHeader>Cognitive Distortion</TableHeader>
              <TableHeader columnType="priority">Frequency</TableHeader>
              <TableHeader columnType="priority">Severity</TableHeader>
              <TableHeader>Therapeutic Intervention</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell label="Cognitive Distortion">All-or-nothing thinking</TableCell>
              <TableCell label="Frequency" columnType="priority">8/10</TableCell>
              <TableCell label="Severity" columnType="priority">High</TableCell>
              <TableCell label="Therapeutic Intervention">Thought records, balanced thinking exercises</TableCell>
            </TableRow>
            <TableRow>
              <TableCell label="Cognitive Distortion">Catastrophizing</TableCell>
              <TableCell label="Frequency" columnType="priority">6/10</TableCell>
              <TableCell label="Severity" columnType="priority">Medium</TableCell>
              <TableCell label="Therapeutic Intervention">Probability estimation, worst-case planning</TableCell>
            </TableRow>
          </TableBody>
        </CompleteTable>
      </section>

      {/* Progress Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Progress Table</h2>
        <CompleteTable variant="progress">
          <TableHead>
            <TableRow>
              <TableHeader>Goal</TableHeader>
              <TableHeader columnType="priority">Progress</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow variant="positive">
              <TableCell label="Goal">Daily meditation</TableCell>
              <TableCell label="Progress" columnType="priority">85%</TableCell>
              <TableCell label="Status">On track</TableCell>
            </TableRow>
            <TableRow variant="negative">
              <TableCell label="Goal">Sleep schedule</TableCell>
              <TableCell label="Progress" columnType="priority">45%</TableCell>
              <TableCell label="Status">Needs attention</TableCell>
            </TableRow>
          </TableBody>
        </CompleteTable>
      </section>

      {/* Compact Table */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Compact Table</h2>
        <CompleteTable variant="compact" size="sm" striped>
          <TableHead>
            <TableRow>
              <TableHeader>Time</TableHeader>
              <TableHeader>Activity</TableHeader>
              <TableHeader columnType="priority">Mood</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell label="Time">9:00 AM</TableCell>
              <TableCell label="Activity">Morning walk</TableCell>
              <TableCell label="Mood" columnType="priority">7/10</TableCell>
            </TableRow>
            <TableRow>
              <TableCell label="Time">12:00 PM</TableCell>
              <TableCell label="Activity">Lunch with friends</TableCell>
              <TableCell label="Mood" columnType="priority">8/10</TableCell>
            </TableRow>
          </TableBody>
        </CompleteTable>
      </section>

      {/* Wide Table (5+ columns) */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Wide Table (Container Query Responsive)</h2>
        <CompleteTable striped>
          <TableHead>
            <TableRow>
              <TableHeader>Framework</TableHeader>
              <TableHeader>Technique</TableHeader>
              <TableHeader>Application</TableHeader>
              <TableHeader columnType="priority">Difficulty</TableHeader>
              <TableHeader columnType="priority">Effectiveness</TableHeader>
              <TableHeader>Notes</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell label="Framework">CBT</TableCell>
              <TableCell label="Technique">Thought Records</TableCell>
              <TableCell label="Application">Anxiety management</TableCell>
              <TableCell label="Difficulty" columnType="priority">3/5</TableCell>
              <TableCell label="Effectiveness" columnType="priority">4/5</TableCell>
              <TableCell label="Notes">Very effective for automatic thoughts</TableCell>
            </TableRow>
            <TableRow>
              <TableCell label="Framework">DBT</TableCell>
              <TableCell label="Technique">Distress Tolerance</TableCell>
              <TableCell label="Application">Crisis management</TableCell>
              <TableCell label="Difficulty" columnType="priority">4/5</TableCell>
              <TableCell label="Effectiveness" columnType="priority">5/5</TableCell>
              <TableCell label="Notes">Essential for emotional regulation</TableCell>
            </TableRow>
          </TableBody>
        </CompleteTable>
      </section>

      {/* WIDE TABLE SYSTEM DEMONSTRATIONS */}
      
      {/* Priority Plus Pattern (5-7 columns) */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Priority Plus Pattern (7 columns)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Shows 3-4 most important columns, hides others with &ldquo;+X more&rdquo; indicator on tablet
        </p>
        <WideTableDemo strategy="priority-plus" />
      </section>

      {/* Note: Horizontal scroll removed - 6+ columns now use alternative views */}

      {/* Column Toggle System */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Column Management System</h2>
        <p className="text-sm text-gray-600 mb-4">
          User-controlled column visibility with preferences persistence
        </p>
        <WideTableDemo strategy="column-toggle" showColumnManager />
      </section>

      {/* Adaptive Cards (Mobile) */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Adaptive Card Transformation</h2>
        <p className="text-sm text-gray-600 mb-4">
          Wide tables automatically transform to cards on mobile devices
        </p>
        <div style={{ maxWidth: '400px' }}> {/* Simulate mobile container */}
          <WideTableDemo strategy="adaptive-cards" />
        </div>
      </section>
    </div>
  );
}

/**
 * Wide Table Demo Component - Shows different strategies
 */
function WideTableDemo({ 
  strategy, 
  showColumnManager = true 
}: { 
  strategy: 'priority-plus' | 'column-toggle' | 'adaptive-cards';
  showColumnManager?: boolean;
}) {
  // Define comprehensive therapeutic assessment columns
  const therapeuticColumns: WideColumnDefinition[] = [
    {
      id: 'patient',
      header: 'Patient',
      type: 'content',
      priority: 'high',
      alwaysVisible: true,
    },
    {
      id: 'session_date',
      header: 'Session Date',
      type: 'priority',
      priority: 'high',
    },
    {
      id: 'primary_concern',
      header: 'Primary Concern',
      type: 'content',
      priority: 'high',
    },
    {
      id: 'mood_score',
      header: 'Mood Score',
      type: 'priority',
      priority: 'medium',
    },
    {
      id: 'intervention',
      header: 'Therapeutic Intervention',
      type: 'framework',
      priority: 'medium',
    },
    {
      id: 'homework',
      header: 'Homework Assigned',
      type: 'content',
      priority: 'low',
    },
    {
      id: 'follow_up',
      header: 'Follow-up Actions',
      type: 'content',
      priority: 'low',
    },
    {
      id: 'next_session',
      header: 'Next Session',
      type: 'priority',
      priority: 'medium',
    },
  ];

  const sampleData = [
    {
      patient: 'Patient A',
      session_date: '2025-08-09',
      primary_concern: 'Work anxiety',
      mood_score: '6/10',
      intervention: 'CBT - Thought Records',
      homework: 'Daily mood tracking',
      follow_up: 'Monitor sleep patterns',
      next_session: '2025-08-16',
    },
    {
      patient: 'Patient B', 
      session_date: '2025-08-08',
      primary_concern: 'Relationship stress',
      mood_score: '4/10',
      intervention: 'DBT - Distress Tolerance',
      homework: 'TIPP exercises',
      follow_up: 'Crisis plan review',
      next_session: '2025-08-15',
    },
    {
      patient: 'Patient C',
      session_date: '2025-08-07', 
      primary_concern: 'Social anxiety',
      mood_score: '7/10',
      intervention: 'Exposure Therapy',
      homework: 'Gradual exposure tasks',
      follow_up: 'Progress assessment',
      next_session: '2025-08-14',
    },
  ];

  return (
    <WideTable
      columns={therapeuticColumns}
      strategy={strategy}
      maxVisibleColumns={4}
      stickyFirstColumn={true}
      allowColumnManagement={true}
      showColumnManager={showColumnManager}
      enableKeyboardNavigation={true}
    >
      <TableHead>
        <TableRow>
          {therapeuticColumns.map((column) => (
            <TableHeader
              key={column.id}
              columnType={column.type}
              data-priority={column.priority}
            >
              {column.header}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sampleData.map((row, index) => (
          <TableRow key={index}>
            {therapeuticColumns.map((column) => (
              <TableCell
                key={column.id}
                label={column.header}
                columnType={column.type}
                data-priority={column.priority}
              >
                {row[column.id as keyof typeof row]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </WideTable>
  );
}

export default TableDemo;