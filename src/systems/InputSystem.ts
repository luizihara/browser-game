import type { Disposable } from '../types';

export const InputAction = {
  MoveUp: 'MoveUp',
  MoveDown: 'MoveDown',
  MoveLeft: 'MoveLeft',
  MoveRight: 'MoveRight',
  Pause: 'Pause',
  DebugSpawn: 'DebugSpawn',
  DebugClear: 'DebugClear',
} as const;

export type InputAction = (typeof InputAction)[keyof typeof InputAction];

export class InputSystem implements Disposable {
  private keyBindings: Map<string, InputAction> = new Map();
  private activeActions: Set<InputAction> = new Set();
  private justPressedActions: Set<InputAction> = new Set();

  constructor() {
    this.setupDefaultBindings();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private setupDefaultBindings(): void {
    this.bindKey('KeyW', InputAction.MoveUp);
    this.bindKey('ArrowUp', InputAction.MoveUp);

    this.bindKey('KeyS', InputAction.MoveDown);
    this.bindKey('ArrowDown', InputAction.MoveDown);

    this.bindKey('KeyA', InputAction.MoveLeft);
    this.bindKey('ArrowLeft', InputAction.MoveLeft);

    this.bindKey('KeyD', InputAction.MoveRight);
    this.bindKey('ArrowRight', InputAction.MoveRight);

    this.bindKey('Escape', InputAction.Pause);

    // Development sandbox debug keys
    this.bindKey('KeyB', InputAction.DebugSpawn);
    this.bindKey('KeyC', InputAction.DebugClear);
  }

  public bindKey(code: string, action: InputAction): void {
    this.keyBindings.set(code, action);
  }

  public unbindKey(code: string): void {
    this.keyBindings.delete(code);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const action = this.keyBindings.get(event.code);
    if (!action) return;

    // Prevent default browser actions for game keys (e.g. arrow keys scrolling)
    if (action !== InputAction.Pause) {
      event.preventDefault();
    }

    if (!this.activeActions.has(action)) {
      this.justPressedActions.add(action);
    }
    this.activeActions.add(action);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const action = this.keyBindings.get(event.code);
    if (!action) return;

    this.activeActions.delete(action);
  }

  private handleBlur(): void {
    this.reset();
  }

  public isActionActive(action: InputAction): boolean {
    return this.activeActions.has(action);
  }

  public isActionJustPressed(action: InputAction): boolean {
    return this.justPressedActions.has(action);
  }

  /**
   * Clears single-frame actions (like justPressed). Should be called at the end of the frame.
   */
  public update(): void {
    this.justPressedActions.clear();
  }

  public reset(): void {
    this.activeActions.clear();
    this.justPressedActions.clear();
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.reset();
  }
}
