// The 'test_election_voting1212' test program.
import election_voting1212.aleo;
program test_election_voting1212.aleo {
    @test
    script test_it() {
        let result: u32 = election_voting1212.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = election_voting1212.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}
