class Banking {
  constructor() {}

  public getPaidHistory() {
    return [
      {
        id: 1,
        date: "2021-08-01",
        amount: 100000,
        description: "SK주유소_등유",
      },
      {
        id: 2,
        date: "2021-08-02",
        amount: 200000,
        description: "GS주유소_휘발유",
      },
      {
        id: 3,
        date: "2021-08-03",
        amount: 300000,
        description: "전기료",
      },
      {
        id: 4,
        date: "2021-08-04",
        amount: 400000,
        description: "가스비",
      },
      {
        id: 5,
        date: "2021-08-05",
        amount: 500000,
        description: "통신비",
      },
    ];
  }
}

const banking = new Banking();

export default banking;
