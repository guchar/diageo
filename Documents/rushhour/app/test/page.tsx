export default function TestPage() {
  return (
    <div
      style={{
        border: "4px solid red",
        padding: "20px",
        margin: "20px",
        background: "white",
      }}
    >
      <h1
        style={{
          color: "black",
          fontSize: "24px",
        }}
      >
        Test Page
      </h1>
      <p
        style={{
          color: "black",
        }}
      >
        If you can see this text in a red border, basic page rendering is
        working.
      </p>
    </div>
  );
}
