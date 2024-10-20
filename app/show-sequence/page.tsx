import {
  ArchiveBoxArrowDownIcon,
  FolderArrowDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';


export default function ShowSequence() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <p>
        Someday, this will be a page to export various data formats (save settings to a file, export show data perhaps?).
      </p>
      <div className="flex gap-4">
      <button className="btn"><ArchiveBoxArrowDownIcon /> Save</button>
      <button className="btn"><FolderArrowDownIcon /> Save</button>
      <button className="btn"><DocumentArrowDownIcon /> Save</button>
      <button className="btn">Cancel</button>
      </div>
    </main>
  );
}