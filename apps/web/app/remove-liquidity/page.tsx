import dynamic from "next/dynamic";

export default dynamic(() => import("./remove-liquidity"), {
  ssr: false,
});
