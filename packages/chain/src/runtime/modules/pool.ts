import { runtimeMethod, RuntimeModule, runtimeModule, state } from "@proto-kit/module";
import { inject } from "tsyringe";
import { Balances } from "./balances";
import { Field } from "o1js";
import { State } from "@proto-kit/protocol";

@runtimeModule()
export class PoolModule extends RuntimeModule<{}> {
    @state() public poolCount = State.from(Field);
    public constructor(@inject("Balances") private balances: Balances) {
        super();
    }

    @runtimeMethod()
    public async createPool() {}

    @runtimeMethod()
    public async addLiquidity() {}

    @runtimeMethod()
    public async removeLiquidity() {}
}
