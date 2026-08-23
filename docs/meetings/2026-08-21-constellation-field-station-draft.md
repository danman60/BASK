Constellation Field StationLegacy PC Data Acquisition and Agent-Assisted 
Recovery System1. Purpose

Build a field acquisition system that allows an operator to arrive at an 
aging, decommissioned, partially functional, or unfamiliar Windows business 
computer and recover its important business data, application 
configuration, databases, historical backups, and system context with as 
little interaction with the target computer as possible.

The ideal field workflow is:

*Power on target PC → connect Ethernet cable to Constellation laptop → 
acquire everything important from the laptop.*

The target computer should not require:

   - 
   
   internet access,
   - 
   
   Wi-Fi,
   - 
   
   Tailscale,
   - 
   
   cloud connectivity,
   - 
   
   modern software,
   - 
   
   an existing agent,
   - 
   
   or installation into the operator's infrastructure.
   
The operator's laptop is already a trusted member of the existing *Constellation 
Tailscale network* and acts as the bridge between the unknown legacy 
machine and the rest of Constellation.

The system should automatically do as much as possible, then escalate 
ambiguous situations to Constellation agents such as Claude Code, Codex, or 
other analysis agents without requiring those agents to run directly on the 
legacy machine.
------------------------------
2. The Problem

There are numerous legacy business PCs containing operational data that 
needs to be recovered and consolidated.

These machines may be:

   - 
   
   Windows 7, Windows 8, Windows 10, or other aging Windows installations,
   - 
   
   decommissioned,
   - 
   
   poorly maintained,
   - 
   
   disconnected from their original network,
   - 
   
   missing internet access,
   - 
   
   unable to connect to modern Wi-Fi,
   - 
   
   running old database engines,
   - 
   
   running proprietary vertical-market applications,
   - 
   
   carrying years of historical backups,
   - 
   
   partially broken,
   - 
   
   unusually configured,
   - 
   
   or poorly documented.
   
The important data may live in many different places:

   - 
   
   SQL Server,
   - 
   
   SQL Server Express,
   - 
   
   Microsoft Access,
   - 
   
   SQLite,
   - 
   
   Firebird,
   - 
   
   MySQL,
   - 
   
   PostgreSQL,
   - 
   
   proprietary database formats,
   - 
   
   application folders,
   - 
   
   ProgramData,
   - 
   
   AppData,
   - 
   
   ODBC configurations,
   - 
   
   Windows Registry entries,
   - 
   
   backup folders,
   - 
   
   CSV exports,
   - 
   
   Excel files,
   - 
   
   configuration files,
   - 
   
   scheduled tasks,
   - 
   
   reports,
   - 
   
   application logs,
   - 
   
   or network-path references that reveal where the true data lived.
   
A human operator should not need to manually reverse engineer each PC from 
scratch.

The Field Station should perform that archaeology.
------------------------------
3. Product Thesis

The target PC should be treated as an *unknown data source*, not as a 
machine that needs to become part of Constellation.

The architecture should therefore be:

                    INTERNET
                       ▲
                       │
               Phone Hotspot / Wi-Fi
                       │
                       ▼
          ┌────────────────────────────┐
          │ CONSTELLATION FIELD LAPTOP │
          │                            │
          │ Field Station              │
          │ Acquisition storage        │
          │ Claude / Codex interface   │
          │ Tailscale                  │
          │ Constellation connection   │
          └─────────────┬──────────────┘
                        │
                 Private Ethernet
                        │
                        ▼
                ┌─────────────┐
                │ LEGACY PC   │
                │             │
                │ No Tailscale│
                │ No internet │
                │ required    │
                └─────────────┘

The foundational rule is:

*The target PC never needs to join Constellation. The laptop already 
belongs to Constellation and acts as the trusted intermediary.*

------------------------------
4. Primary User Experience

The desired happy path should require almost no interaction with the target 
PC.
Step 1: Arrive

Operator has:

   - 
   
   Constellation laptop,
   - 
   
   Ethernet cable,
   - 
   
   optional USB Ethernet adapter if laptop lacks Ethernet,
   - 
   
   phone capable of providing Wi-Fi hotspot.
   
Step 2: Power on target

The target Windows PC is powered on normally.

The operator should not need to connect it to the customer's LAN or 
internet.
Step 3: Connect Ethernet

Connect:

*Laptop Ethernet ↔ Target PC Ethernet*

The laptop is simultaneously connected to the operator's phone hotspot over 
Wi-Fi.

Therefore:

Target PC
    ↓ Ethernet
Field Laptop
    ↓ Wi-Fi
Phone Hotspot
    ↓
Internet
    ↓
Tailscale
    ↓
Constellation

Step 4: Field Station detects target

The laptop automatically establishes or configures the private Ethernet 
network and looks for the connected computer.

The UI should transition from:

Waiting for target...

to:

*Target detected*

Example:

FRONTDESK-PC
Windows 7 Professional
1 local disk
Network connectivity established

Step 5: Establish acquisition control

The system attempts its acquisition bootstrap sequence.

Where possible, this should happen without requiring interaction with the 
target.

If authorized Windows credentials are required, they should be requested *on 
the Field Station laptop*, not by making the operator navigate the legacy 
PC.

Example:

Administrator credentials required to inspect this machine.

The operator enters authorized credentials.
Step 6: Automatic discovery

Once control is established:

*Discovery running*

The laptop begins receiving structured information from the target.
Step 7: Automatic acquisition

The system identifies high-confidence business data and safely copies or 
exports it to the laptop.
Step 8: Constellation review

A compact machine manifest is immediately available to Constellation agents.

Agents can determine whether anything important appears to have been missed.
Step 9: Finish

Field Station reports:

*Acquisition complete*

Primary database captured
Application configuration captured
Historical backups captured
Equipment configuration captured
Checksums verified
Constellation review complete

*Safe to disconnect*

The operator leaves with the acquisition stored on the laptop and 
optionally synchronized into Constellation.
------------------------------
5. Design Principle: Ethernet Is the Umbilical Cord

The system should be designed around a direct Ethernet link.

The target computer should not require:

   - 
   
   hotspot credentials,
   - 
   
   modern Wi-Fi,
   - 
   
   DNS,
   - 
   
   a router,
   - 
   
   Tailscale,
   - 
   
   VPN software,
   - 
   
   inbound internet connectivity,
   - 
   
   or participation in the customer's network.
   
The laptop owns networking.

This is important because the machines are expected to be unreliable.

The direct network should work even when the target has *no internet 
whatsoever*.
------------------------------
6. Laptop Networking Responsibilities

When Field Station enters acquisition mode, the laptop should establish a 
predictable private network on its Ethernet interface.

The exact implementation is left to the engineering agent, but the product 
requirement is:

*Plugging in the Ethernet cable should normally be sufficient to establish 
communication.*

The operator should not ordinarily need to open Windows network settings or 
manually configure IPv4 addresses.

Field Station should handle:

   - 
   
   local addressing,
   - 
   
   target discovery,
   - 
   
   connection health,
   - 
   
   reconnects,
   - 
   
   transfer state,
   - 
   
   and network diagnostics.
   
A fixed private acquisition subnet may be used internally if useful.

Conceptually:

Field Station: 10.77.0.1
Target:        10.77.0.x

The specific addresses are implementation details.
------------------------------
7. Target Bootstrap Strategy

There is a fundamental technical reality:

Ethernet alone does not create arbitrary remote-control access to a Windows 
computer.

Something must provide the laptop with permission and an execution path.

Therefore Field Station should use a *progressive bootstrap strategy*, from 
least invasive to more explicit methods.

The system should hide this complexity from the operator.
Bootstrap Stage A: Passive discovery

Before changing anything, determine what the target exposes.

Attempt to identify:

   - 
   
   hostname,
   - 
   
   operating system,
   - 
   
   network services,
   - 
   
   Windows sharing,
   - 
   
   Windows management capabilities,
   - 
   
   existing database ports,
   - 
   
   existing application services.
   
This may provide substantial information without deploying anything.
Bootstrap Stage B: Authorized remote management

If available and authorized, use existing Windows administrative 
capabilities to establish a temporary acquisition session.

The operator may be prompted for local administrator credentials.

The goal is:

*Authenticate from laptop → temporarily bootstrap acquisition component → 
begin C&C*

No persistent installation should be required.
Bootstrap Stage C: Temporary Field Agent

If richer inspection is required, Field Station deploys a small *temporary 
Field Agent* to the target.

The Field Agent:

   - 
   
   runs only for the acquisition session,
   - 
   
   connects only to the Field Station over the private Ethernet link,
   - 
   
   exposes a deliberately limited acquisition API,
   - 
   
   does not join Tailscale,
   - 
   
   does not require internet,
   - 
   
   does not persist after the acquisition unless explicitly required,
   - 
   
   and does not autonomously make business decisions.
   
This is the preferred mechanism for complex acquisition.
------------------------------
8. Field Agent Responsibilities

The Field Agent is deliberately simple.

Its job is to safely expose the target machine's data and environment to 
Field Station.

It should support capabilities conceptually equivalent to:

machine.inventory

disk.list
disk.health_summary

filesystem.list
filesystem.search
filesystem.metadata
filesystem.read

applications.list

processes.list
services.list

registry.search
registry.read

odbc.list

database.engines
database.instances
database.list
database.schema
database.backup

scheduled_tasks.list

network.configuration

artifact.collect
artifact.hash

capture.status

The engineering agent may divide or rename these operations.

The key constraint is:

*Claude, Codex, or another LLM should interact with the target through 
controlled acquisition functions rather than unrestricted autonomous 
execution on the legacy PC.*

------------------------------
9. Read-Only by Default

The system is fundamentally an acquisition and preservation tool.

Its default posture must be:

*Inspect, identify, export, copy, verify. Do not modify.*

Normal discovery should not:

   - 
   
   alter source databases,
   - 
   
   change application settings,
   - 
   
   uninstall software,
   - 
   
   modify business records,
   - 
   
   modify the Registry,
   - 
   
   alter services,
   - 
   
   delete files,
   - 
   
   change permissions unnecessarily,
   - 
   
   or modify the customer's operating environment.
   
Some operations, such as creating a native database backup, may cause 
normal database-engine activity. These actions should be explicitly defined 
as safe acquisition operations.
------------------------------
10. Automatic Discovery Pass

Once connected, Field Station performs an initial structured inventory.
Machine

Capture:

   - 
   
   hostname,
   - 
   
   Windows version,
   - 
   
   architecture,
   - 
   
   memory,
   - 
   
   disks,
   - 
   
   volumes,
   - 
   
   free space,
   - 
   
   logged-in users,
   - 
   
   system time,
   - 
   
   relevant network configuration.
   
Installed applications

Identify:

   - 
   
   application name,
   - 
   
   version,
   - 
   
   install path,
   - 
   
   publisher where available.
   
Pay particular attention to:

   - 
   
   vertical business applications,
   - 
   
   POS software,
   - 
   
   scheduling software,
   - 
   
   membership systems,
   - 
   
   accounting systems,
   - 
   
   database utilities,
   - 
   
   backup utilities.
   
Processes

Look for processes associated with:

   - 
   
   business applications,
   - 
   
   databases,
   - 
   
   backup systems,
   - 
   
   hardware controllers.
   
Services

Identify:

   - 
   
   SQL Server,
   - 
   
   SQL Server Express,
   - 
   
   Firebird,
   - 
   
   MySQL/MariaDB,
   - 
   
   PostgreSQL,
   - 
   
   proprietary database services,
   - 
   
   application services,
   - 
   
   backup services.
   
ODBC

Enumerate relevant:

   - 
   
   system DSNs,
   - 
   
   user DSNs,
   - 
   
   drivers,
   - 
   
   server references,
   - 
   
   database names.
   
Legacy applications frequently reveal their authoritative database through 
ODBC.
Registry

Search intelligently for application-specific:

   - 
   
   installation paths,
   - 
   
   server locations,
   - 
   
   database references,
   - 
   
   backup paths,
   - 
   
   configuration paths.
   
Do not blindly dump the entire Registry when targeted discovery is 
sufficient.
Scheduled tasks

Identify tasks related to:

   - 
   
   backups,
   - 
   
   exports,
   - 
   
   maintenance,
   - 
   
   database dumps,
   - 
   
   synchronization.
   
A scheduled backup script may reveal the canonical acquisition method.
------------------------------
11. File Discovery

Search high-value locations first.

Examples include:

C:\Program Files\
C:\Program Files (x86)\
C:\ProgramData\
C:\Users\<user>\AppData\
C:\Users\Public\
application-specific folders
backup folders
non-system secondary drives

Candidate file types include:

*.db
*.sqlite
*.sqlite3
*.mdb
*.accdb
*.mdf
*.ldf
*.bak
*.fdb
*.gdb
*.csv
*.xls
*.xlsx
*.xml
*.json
*.ini
*.config
*.conf
*.log

The system should not simply collect every matching file.

It should rank artifacts based on evidence that they belong to the relevant 
business environment.
------------------------------
12. Candidate Data Confidence

Every discovered data source should receive an explainable confidence 
rating.

Example:

*High confidence*

SQL database SALONDB

Evidence:

   - 
   
   referenced by application ODBC configuration,
   - 
   
   active database service,
   - 
   
   contains Customers, Transactions, Memberships, Inventory tables,
   - 
   
   application executable connects to same instance.
   
Another file might show:

*Medium confidence*

C:\OldExports\Customers2018.csv

Historical customer export, may contain legacy records.

This is useful both for the operator and Constellation agents.
------------------------------
13. Database-Aware Acquisition

Database files should not be blindly copied while live whenever a safer 
native export exists.

The acquisition system should detect database engines and choose an 
appropriate preservation method.

Examples conceptually include:

   - 
   
   SQL Server → native backup,
   - 
   
   PostgreSQL → logical/database backup,
   - 
   
   MySQL/MariaDB → database dump,
   - 
   
   SQLite → safe backup/copy procedure,
   - 
   
   Access → consistent file acquisition,
   - 
   
   Firebird → appropriate backup/export mechanism.
   
The exact implementation belongs to the build agent.

Product requirement:

*Acquire the authoritative data consistently and safely, preserving the 
original whenever possible.*

------------------------------
14. What Must Be Acquired

The system should deliberately acquire more than the apparent primary 
database.

For every identified business application, investigate:
Primary live database

The authoritative current data.
Historical backups

Potentially years of history.
Application configuration

Important for understanding:

   - 
   
   location identity,
   - 
   
   database connections,
   - 
   
   business settings,
   - 
   
   hardware configuration,
   - 
   
   service types,
   - 
   
   tenant identifiers.
   
Reports and exports

CSV, Excel, PDF, XML, or proprietary exports may contain information no 
longer represented cleanly in the live application.
Logs

Useful for understanding:

   - 
   
   integrations,
   - 
   
   table names,
   - 
   
   server names,
   - 
   
   historical failures,
   - 
   
   file paths.
   
Hardware/equipment configuration

Where business systems interact with equipment, room controllers, timers, 
scanners, printers, or other peripherals.
Relevant Registry settings

Only when connected to the business application.
ODBC configuration

Preserve enough information to reconstruct the source environment.
Application/version metadata

Critical for later schema interpretation.
------------------------------
15. Acquisition Destination

The primary destination should be the *Field Station laptop*, not the 
target machine and not a USB key.

Advantages:

   - 
   
   more storage,
   - 
   
   faster analysis,
   - 
   
   immediate access for agents,
   - 
   
   easier synchronization,
   - 
   
   easier verification,
   - 
   
   less dependency on target hardware.
   
Example capture structure:

/captures/
  CAP-000184/
    machine/
    manifest/
    original/
    databases/
    backups/
    configs/
    registry/
    odbc/
    reports/
    logs/
    application/
    agent-findings/
    collection-log/
    hashes/

------------------------------
16. Preserve Originals

The system should separate:

01_original
02_extracted
03_normalized
04_analysis
05_reports

Original captured artifacts should not subsequently be modified by parsers 
or AI agents.

All normalization and analysis happens against working copies.
------------------------------
17. Verification

Every important artifact should receive a cryptographic checksum.

A capture should be able to prove:

This file is the exact artifact acquired from the source environment.

The manifest should include:

   - 
   
   source path,
   - 
   
   file size,
   - 
   
   capture timestamp,
   - 
   
   acquisition method,
   - 
   
   hash,
   - 
   
   success/failure status.
   
------------------------------
18. Machine Manifest

Every acquisition should generate a structured machine manifest.

Example concept:

{
  "capture_id": "CAP-000184",
  "machine": {
    "hostname": "FRONTDESK-PC",
    "os": "Windows 7 Professional",
    "architecture": "x64"
  },
  "applications": [],
  "database_engines": [],
  "database_candidates": [],
  "business_application_candidates": [],
  "odbc_connections": [],
  "backup_locations": [],
  "configuration_candidates": [],
  "artifacts_collected": [],
  "artifacts_pending": [],
  "warnings": []
}

This becomes the primary context document for Constellation agents.
------------------------------
19. Constellation Integration

The Field Station laptop is already connected to the existing *Constellation 
Tailscale network*.

The target does not need access to Constellation.

Field Station should expose the active acquisition to Constellation.

The first thing synchronized should be small:

   - 
   
   machine manifest,
   - 
   
   discovery results,
   - 
   
   progress,
   - 
   
   logs,
   - 
   
   candidate data sources.
   
Do not make agent collaboration dependent on transferring multi-gigabyte 
databases first.
------------------------------
20. Constellation Agent Role

Constellation agents act as expert investigators.

They receive structured information about the target and can ask:

Have we found the authoritative customer database?

Are there references to another database?

Is there an archive database?

Does this application maintain historical backups somewhere else?

What is the safest acquisition method?

Are there application-specific configuration files we have not collected?

Does the schema contain the business entities we expect?

Agents should be able to interrogate the target indirectly through Field 
Station.
------------------------------
21. Agent Control Loop

Example:

TARGET PC
   ↓
Field Agent
   ↓
Private Ethernet
   ↓
Field Station
   ↓
Manifest
   ↓
Constellation Agent
   ↓
Analysis
   ↓
Additional acquisition request
   ↓
Field Station
   ↓
Field Agent
   ↓
Target

This creates an interactive rescue loop while keeping the target isolated.
------------------------------
22. Example Agent Investigation

Field Station reports:

SQL Server Express detected.
Database SalonLive collected.
14 backup files found.

The Constellation agent inspects the manifest and says:

SalonLive appears to contain current customers and transactions.

However, ODBC configuration references a second database named SalonArchive.

The archive has not been collected.

I recommend inspecting and acquiring SalonArchive before disconnecting.

Field Station displays:

*Additional data recommended*

SalonArchive database
Confidence: high

*Acquire*

The operator approves.
------------------------------
23. Agent Permissions

Agent access should be scoped.

Default agent capabilities should include:

   - 
   
   inspect,
   - 
   
   search,
   - 
   
   analyze,
   - 
   
   request artifact,
   - 
   
   request database schema,
   - 
   
   request safe backup.
   
Agents should not silently gain broad unrestricted administrative control.

Potentially destructive operations should not be part of normal acquisition.
------------------------------
24. Operator UI

The primary UI is *Constellation Field Station* on the laptop.

It should be understandable under field conditions.
Home

CONSTELLATION FIELD STATION

Wi-Fi:       Connected
Tailscale:   Connected
Constellation: Online
Ethernet:    Waiting for target...

When connected:

TARGET DETECTED

FRONTDESK-PC
Windows 7 Professional

[Begin Acquisition]

Ideally acquisition begins automatically once authorization requirements 
are satisfied.
------------------------------
25. Acquisition Screen

Example:

FRONTDESK-PC

*Connection:* Gigabit Ethernet
*Status:* Acquiring

✓ Machine inventory
✓ Installed applications
✓ Database engines
✓ ODBC
✓ Application configuration
✓ Primary database
◉ Historical backups
○ Constellation review

*8.4 GB captured*

------------------------------
26. Important Findings

Field Station should surface useful findings without requiring raw 
technical interpretation.

Example:

Business system detected

TanTrack 3.x
Primary data

SQL Server database
4.3 GB
High confidence
Historical data

17 backup files
11.8 GB
Configuration

Equipment configuration found
ODBC connection found
Application settings found

------------------------------
27. Agent Review UI

Provide an *Ask Constellation* interface.

Example prompts:

Are we missing anything important?

Find all customer-related databases.

Is there historical transaction data outside the live database?

Determine how this application performs backups.

Find anything related to memberships.

Is this safe to disconnect?

The actual AI can run in the laptop environment or elsewhere within 
Constellation.
------------------------------
28. Completion Gate

Do not simply report that copying finished.

Field Station should have a formal completion state.

Example:

Acquisition complete

✓ Primary database captured
✓ Historical backups captured
✓ Application configuration captured
✓ ODBC configuration captured
✓ Relevant Registry configuration captured
✓ File checksums verified
✓ Constellation agent review complete

*No additional high-confidence data sources identified.*

Safe to disconnect.

If unresolved questions remain:

*Review recommended before disconnecting*

An archive database is referenced but has not been captured.

------------------------------
29. Target-PC Failure Modes

The system is specifically intended for aging machines.

Failure handling is therefore a core requirement.
Windows boots normally

Use normal Ethernet acquisition.
Windows boots but business software does not

Still inspect:

   - 
   
   filesystem,
   - 
   
   services,
   - 
   
   Registry,
   - 
   
   ODBC,
   - 
   
   databases,
   - 
   
   backups.
   
The business application itself does not need to run.
Windows boots but internet does not

Irrelevant.

The target does not need internet.
Windows boots but target networking is partially broken

Field Station should diagnose the Ethernet link and explain the failure.

A future fallback acquisition path may be required.
Windows does not boot

This falls outside the normal Ethernet-to-running-Windows path.

The architecture should anticipate a later recovery mode such as:

   - 
   
   PXE/network boot from Field Station,
   - 
   
   recovery USB,
   - 
   
   direct disk attachment.
   
These are fallback modes, not first-build requirements unless the 
implementation agent determines they are inexpensive to include.
PC itself is dead but disk survives

Future fallback:

Remove disk → attach to Field Station → acquire directly.

------------------------------
30. PXE Recovery as Future Capability

A natural future extension is for Field Station to act as a network boot 
server.

Then:

Legacy PC
   ↓ Ethernet
PXE boot
   ↓
Recovery environment served by laptop
   ↓
Read local disks
   ↓
Stream data to Field Station

This would preserve the one-cable philosophy even when Windows itself is 
unusable.

Do not let PXE complexity delay the first working Windows acquisition path.
------------------------------
31. Security Boundary

The legacy computer should be considered untrusted.

The Field Station laptop should protect itself accordingly.

Requirements:

   - 
   
   acquisition Ethernet is logically distinct from Tailscale,
   - 
   
   target receives no implicit access to Constellation,
   - 
   
   do not bridge the target directly onto the tailnet,
   - 
   
   do not expose homelab services to the target,
   - 
   
   validate transferred data before processing where appropriate,
   - 
   
   use authenticated Field Agent sessions,
   - 
   
   uniquely identify acquisition sessions,
   - 
   
   maintain logs of actions,
   - 
   
   do not retain unnecessary credentials.
   
The laptop is a *gateway*, not a transparent network bridge.
------------------------------
32. Authorization

The system is intended only for machines and data the operator is 
authorized to access and migrate.

Credentials should not be bypassed merely because a machine is connected by 
Ethernet.

If access requires administrative authentication, Field Station should 
request authorized credentials from the operator.

The acquisition report should record the method used without storing 
plaintext credentials.
------------------------------
33. No Persistent Footprint

The target-side Field Agent should ideally be ephemeral.

Normal lifecycle:

Bootstrap
   ↓
Run
   ↓
Acquire
   ↓
Close session
   ↓
Remove temporary agent/files

The system should avoid leaving behind:

   - 
   
   permanent services,
   - 
   
   startup entries,
   - 
   
   remote-access software,
   - 
   
   unnecessary accounts,
   - 
   
   persistent listeners.
   
------------------------------
34. Acquisition Log

Maintain a full session record.

Example:

10:31 Target detected
10:32 Authorized session established
10:33 SQL Server Express detected
10:34 TanTrack candidate identified
10:35 Primary database identified
10:36 Native database backup started
10:41 Backup completed
10:42 SHA-256 verified
10:43 Historical backup search completed
10:44 Constellation review started
10:46 Archive database identified
10:47 Archive acquisition approved
10:50 Acquisition completed

This is useful for troubleshooting and repeatability.
------------------------------
35. Application-Specific Acquisition Recipes

As different legacy applications are encountered, the system should 
accumulate reusable knowledge.

Example conceptual recipe:

Application:
TanTrack

Detection:
- executable path
- Registry signature
- SQL instance
- ODBC signature

Likely data:
- primary database
- equipment configuration
- backup directory
- reports

Safe acquisition:
- native SQL backup
- configuration copy
- backup archive copy

The same architecture should support:

   - 
   
   salon software,
   - 
   
   retail software,
   - 
   
   scheduling systems,
   - 
   
   CRM,
   - 
   
   industry-specific software,
   - 
   
   other legacy business applications.
   
The acquisition framework itself should remain industry-agnostic.
------------------------------
36. Recipe Learning

Constellation agents should help improve future acquisition.

After successfully reverse engineering an unknown environment:

"We discovered application X stores its database here and its configuration 
there."

That should be capable of becoming a reusable acquisition recipe.

The next PC running that software should require much less agent 
investigation.

Over time:

UNKNOWN ENVIRONMENT
        ↓
Agent investigation
        ↓
Successful acquisition
        ↓
Validated recipe
        ↓
Future machine
        ↓
Automatic acquisition

This creates an accumulating migration knowledge base.
------------------------------
37. Source-to-Canonical Pipeline

Field Station's responsibility ends with reliable acquisition and source 
understanding.

Do not tightly couple acquisition to the final analytics system.

Downstream:

LEGACY PC
    ↓
Field Station acquisition
    ↓
Raw source package
    ↓
Source-specific parser
    ↓
Canonical business model
    ↓
Analytics / ML / AI

For the salon project, the canonical model may eventually include:

   - 
   
   customers,
   - 
   
   visits,
   - 
   
   transactions,
   - 
   
   memberships,
   - 
   
   inventory,
   - 
   
   products,
   - 
   
   staff,
   - 
   
   equipment,
   - 
   
   marketing,
   - 
   
   payments.
   
But Field Station should not be designed exclusively around tanning.
------------------------------
38. Capture Package

Every completed acquisition should be portable and self-describing.

Example:

CAP-000184/
│
├── capture.json
├── machine.json
├── manifest.json
├── acquisition.log
├── hashes.sha256
│
├── original/
│   ├── databases/
│   ├── backups/
│   ├── configuration/
│   ├── reports/
│   └── logs/
│
├── environment/
│   ├── installed-apps.json
│   ├── services.json
│   ├── odbc.json
│   ├── registry.json
│   └── scheduled-tasks.json
│
├── agent-findings/
│   ├── initial-review.md
│   └── final-review.md
│
└── analysis/

------------------------------
39. Acquisition Report

Field Station should generate a human-readable summary.

Example:

FRONTDESK-PC Acquisition

*Application detected:* TanTrack
*Application version:* 3.x
*Database:* SQL Server Express
Captured

Primary database: 4.3 GB
Historical backups: 17
Backup history: 2013–2026
Application configuration: Yes
Equipment configuration: Yes
ODBC configuration: Yes
Dataset indicators

Customers: detected
Transactions: detected
Memberships: detected
Inventory: detected
Staff: detected
Equipment: detected
Integrity

All primary artifacts checksum verified.
Agent review

No additional high-confidence business data sources identified.

*Status: Ready for ingestion*

------------------------------
40. Performance

The system should prioritize getting the operator off-site quickly.

Discovery should happen while acquisition is underway where practical.

Large file transfers should not block:

   - 
   
   manifest generation,
   - 
   
   agent inspection,
   - 
   
   additional discovery.
   
The system should be able to begin agent analysis from metadata before all 
bulk files are copied.
------------------------------
41. Resumability

If:

   - 
   
   cable disconnects,
   - 
   
   laptop sleeps,
   - 
   
   target reboots,
   - 
   
   transfer fails,
   
the system should preserve progress.

A reconnect should attempt to resume acquisition rather than begin from 
zero.

The capture manifest must distinguish:

   - 
   
   completed,
   - 
   
   partial,
   - 
   
   failed,
   - 
   
   pending.
   
------------------------------
42. Operator Effort Goal

The product should minimize target interaction.

The intended user experience is:

Power on PC.

Plug in Ethernet.

Open Field Station.

Authenticate if required.

Wait for green completion status.

The operator should *not* normally need to:

   - 
   
   understand SQL Server,
   - 
   
   search the Registry,
   - 
   
   find backup directories,
   - 
   
   know database filenames,
   - 
   
   inspect Windows services,
   - 
   
   decipher ODBC,
   - 
   
   open the original business application,
   - 
   
   install Tailscale,
   - 
   
   configure Wi-Fi,
   - 
   
   connect to the customer's network.
   
------------------------------
43. Success Definition

The product succeeds when an operator can approach an unfamiliar legacy 
business computer and reliably answer:

   1. 
   
   *What business applications are installed?*
   2. 
   
   *Where does their authoritative data live?*
   3. 
   
   *What historical data exists?*
   4. 
   
   *What configuration is required to interpret the data?*
   5. 
   
   *Have we safely acquired it?*
   6. 
   
   *Have we verified its integrity?*
   7. 
   
   *Has an intelligent agent checked whether anything important appears to 
   be missing?*
   8. 
   
   *Can we disconnect the machine confidently?*
   
------------------------------
44. First-Build Scope

The first build should prove the primary workflow.
Must work
   
   - 
   
   Field Station runs on the trusted laptop.
   - 
   
   Laptop maintains its normal Wi-Fi/Tailscale connection.
   - 
   
   Target connects by direct Ethernet.
   - 
   
   Target discovery.
   - 
   
   Private acquisition connection.
   - 
   
   Authorized bootstrap of temporary Field Agent where supported.
   - 
   
   Machine inventory.
   - 
   
   Installed application discovery.
   - 
   
   Services/processes.
   - 
   
   ODBC discovery.
   - 
   
   Registry/application-path discovery.
   - 
   
   File search.
   - 
   
   Common database-engine detection.
   - 
   
   Database/file artifact collection.
   - 
   
   Transfer directly to laptop.
   - 
   
   Checksums.
   - 
   
   Capture manifest.
   - 
   
   Acquisition logs.
   - 
   
   Constellation-accessible manifest.
   - 
   
   Agent review workflow.
   - 
   
   Additional artifact request.
   - 
   
   Completion report.
   
Can initially be simplified
   
   - 
   
   exhaustive support for every database engine,
   - 
   
   application-specific recipes,
   - 
   
   sophisticated target identification,
   - 
   
   automated canonical normalization,
   - 
   
   live bulk upload into homelab.
   
Later
   
   - 
   
   PXE recovery.
   - 
   
   Dead-Windows recovery.
   - 
   
   direct disk imaging.
   - 
   
   damaged-drive workflows.
   - 
   
   richer application recipe library.
   - 
   
   automated source-schema interpretation.
   - 
   
   automated canonical data transformation.
   
------------------------------
45. Critical Architectural Rule

Do not make success depend on the target computer having:

   - 
   
   internet,
   - 
   
   cloud access,
   - 
   
   Tailscale,
   - 
   
   Wi-Fi,
   - 
   
   customer network access,
   - 
   
   or modern software.
   
The *only preferred dependency* is:

*Windows boots sufficiently to communicate over Ethernet and authorized 
administrative access can be established.*

Everything beyond that should be provided by the trusted laptop.
------------------------------
46. The Final Intended Experience

The product should ultimately make this possible:

I walk into a location with my Constellation laptop.

I power on an old computer.

I plug one Ethernet cable from my laptop into that computer.

My laptop detects it.

The Field Station establishes an authorized acquisition session.

It inventories the machine automatically.

It identifies the old business software.

It finds the databases, configuration, backups, reports, and supporting 
files.

It safely transfers those artifacts directly to my laptop.

My Constellation agents examine the discovery manifest and collected 
material while I am still on site.

If something looks missing, the agents can ask the Field Station to 
investigate further.

I receive a clear confirmation when the machine has been sufficiently 
acquired.

I unplug the Ethernet cable and move to the next PC.

The target PC never needed internet, Tailscale, or access to my 
infrastructure.

That is *Constellation Field Station*.

The laptop is the trusted appliance.

Ethernet is the acquisition umbilical cord.

The target is temporary and untrusted.

Constellation provides the intelligence.

The output is a complete, verified, self-describing acquisition package 
ready for migration, normalization, analysis, and long-term preservation.

Daniel Abrahamson 
Founder and Chief Technologist

 
w: StreamStage.live
t: 6478833307
e: daniel <danieljohnabrahamson@gmail.com>@streamstage. 
<http://streamstageproductions.com>live  
Studio Owner? Click https://www.studiosage.ai/         

