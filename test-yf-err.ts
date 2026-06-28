import yahooFinance from 'yahoo-finance2';
const test = async () => {
    try {
        const module = await import('yahoo-finance2') as any;
        let yf = module.default;
        await yf.quote('AAPL', { return: 'invalid' } as any);
    } catch (e: any) {
        console.log("e.message =", e?.message || 'Error occurred');
    }
}
test();
