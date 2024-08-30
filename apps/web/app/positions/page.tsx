import dynamic from "next/dynamic";

export default dynamic(() => import("./positions"), {
  ssr: false,
});
