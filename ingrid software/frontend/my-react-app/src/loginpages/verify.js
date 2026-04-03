import { useEffect } from "react";
import { useParams } from "react-router-dom";

function Verify() {
  const { token } = useParams();

  useEffect(() => {
    fetch(`/api/verify/${token}`)
      .then(res => res.text())
      .then(data => alert(data));
  }, [token]);

  return <h2>Verifying your account...</h2>;
}

export default Verify;