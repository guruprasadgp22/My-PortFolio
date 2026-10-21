// Grey placeholder shapes shown for the split second a tab's code is still downloading.
export default function Skeleton() {
  return (
    <div className="skel" aria-busy="true" aria-label="Loading">
      <span className="skel-title" />
      <span className="skel-line" />
      <span className="skel-line short" />
      <div className="skel-cards">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}
