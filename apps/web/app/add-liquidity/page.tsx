import dynamic from "next/dynamic";

export default dynamic(() => import("./add-liquidity"), {
  ssr: false,
});
