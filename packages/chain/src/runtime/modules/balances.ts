import { runtimeMethod, runtimeModule, state } from "@proto-kit/module";
import { State, StateMap } from "@proto-kit/protocol";
import { Balance, Balances as BaseBalances, TokenId } from "@proto-kit/library";
import { Field, PublicKey } from "o1js";

interface BalancesConfig {
    totalSupply: Balance;
}

@runtimeModule()
export class Balances extends BaseBalances<BalancesConfig> {
    @state() public tokens = StateMap.from<Field, TokenId>(Field, TokenId);
    @state() public tokenCount = State.from(Field);
    @state() public circulatingSupply = StateMap.from<TokenId, Balance>(TokenId, Balance);

    public async getCirculatingSupply(tokenId: TokenId): Promise<Balance> {
        const circulatingSupply = await this.circulatingSupply.get(tokenId);
        return Balance.from(circulatingSupply.value);
    }

    @runtimeMethod()
    public async mintToken(tokenId: TokenId, address: PublicKey, amount: Balance): Promise<void> {
        const circulatingSupply = await this.circulatingSupply.get(tokenId);
        const newCirculatingSupply = Balance.from(circulatingSupply.value).add(amount);

        await this.circulatingSupply.set(tokenId, newCirculatingSupply);
        await this.mint(tokenId, address, amount);
    }

    @runtimeMethod()
    public async burnToken(tokenId: TokenId, address: PublicKey, amount: Balance): Promise<void> {
        const circulatingSupply = await this.circulatingSupply.get(tokenId);
        const newCirculatingSupply = Balance.from(circulatingSupply.value).sub(amount);

        await this.circulatingSupply.set(tokenId, newCirculatingSupply);
        await this.burn(tokenId, address, amount);
    }
}
