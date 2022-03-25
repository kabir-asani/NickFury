export class SocialsSuccess { }
export class SocialsFailure { }

// Follow
export class SocialsFollowSuccess extends SocialsSuccess { }

export abstract class SocialsFollowFailure extends SocialsFailure { }
export class UnknownSocialsFollowFailure extends SocialsFollowFailure { }

// Unfollow
export class SocialsUnfollowSuccess extends SocialsSuccess { }

export abstract class SocialsUnfollowFailure extends SocialsFailure { }

export class UnknownSocialsUnfollowFailure extends SocialsUnfollowFailure { }