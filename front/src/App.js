import './App.css';

function App() {
  const testtitle = "hello react";
  const testcontent = "这是散修Sacultor";

const boo = true;
if (boo) {
    console.log("boo is true");
  }else {
    console.log("boo is false");
  }
  return (
    <div title={testtitle}>{testtitle}{testcontent}</div>
  );
}

export default App;
