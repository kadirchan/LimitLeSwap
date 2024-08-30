import dynamic from "next/dynamic";

export default dynamic(() => import("./limit-order"), {
  ssr: false,
});
