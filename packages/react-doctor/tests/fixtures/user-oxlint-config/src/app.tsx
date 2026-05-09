import { useState } from "react";

const App = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    debugger;
    if (count > 0) {
    }
    setCount((previous) => previous + 1);
  };

  return <button onClick={handleClick}>{count}</button>;
};

export { App };
