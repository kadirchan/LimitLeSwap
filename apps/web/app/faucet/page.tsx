import dynamic from "next/dynamic";

export default dynamic(() => import("./faucet"), {
  ssr: false,
});
