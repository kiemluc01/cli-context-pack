export const EXIT = { OK: 0, FAILED: 1, USAGE: 2, DRIFT: 3 };
/** Every error says what happened (message), why (reason) and how to fix it (fix). */
export class CtxpackError extends Error {
    code;
    reason;
    fix;
    exitCode;
    constructor(code, message, reason, fix, exitCode = EXIT.FAILED) {
        super(message);
        this.code = code;
        this.reason = reason;
        this.fix = fix;
        this.exitCode = exitCode;
        this.name = "CtxpackError";
    }
}
