import dynamic from "next/dynamic";

export default dynamic(() => import("./create-pool"), {
  ssr: false,
});
