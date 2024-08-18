import ChatButton from "./components/ChatButton";

function App() {
  return (
    <div
      className="App"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
        height: "100vh",
      }}
    >
      <ChatButton />
    </div>
  );
}

export default App;
