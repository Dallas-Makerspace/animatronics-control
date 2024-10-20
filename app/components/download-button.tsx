import { ArchiveBoxArrowDownIcon } from "@heroicons/react/24/outline";
import { Button } from "@nextui-org/button";

type DownloadButtonProps = {
  generateBlob: () => Blob;
  title: string;
  icon?: React.ReactNode;
  defaultFileName?: string;
  includeTimestamp?: boolean;
};

export function DownloadButton(props: DownloadButtonProps) {
  const doDownload = () => {
    if (!props.generateBlob || typeof props.generateBlob !== 'function') {
      console.error('No generateBlob function provided to DownloadButton');
      return;
    }
    const blob = props.generateBlob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let suggestedFileName = props.defaultFileName ? props.defaultFileName : 'file';
    if (props.includeTimestamp) {
      const re = /(?:\.([^.]+))?$/;
      const match = re.exec(suggestedFileName);
      const ext = match ? match[1] : '';
      suggestedFileName = suggestedFileName.replace(re, `-${new Date().toISOString()}${ext ? `.${ext}` : ''}`);
    }
    link.setAttribute(
      'download',
      suggestedFileName,
    );
    document.body.appendChild(link); // Append to html link element page - required to work in some browsers
    link.click(); // Start download
    link.parentNode?.removeChild(link); // Clean up and remove the link (if we can)
  };

  return (
    // TODO: Icon is not currently working
    <Button onClick={doDownload} startContent={<ArchiveBoxArrowDownIcon />} endContent={<ArchiveBoxArrowDownIcon />} color="primary">
      {props.title}
    </Button>
  )
}