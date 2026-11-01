type BlankSheetLinkProps = { mazeId: string };

// A plain link: the API answers with a PDF download, so no client code is needed
const BlankSheetLink = ({ mazeId }: BlankSheetLinkProps) => (
  <a className="text-button" href={`/api/maze/${mazeId}/pdf`} download>
    Print blank maze
  </a>
);

export default BlankSheetLink;