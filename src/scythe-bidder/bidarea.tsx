/** @jsx jsx */

import React from "react";
import { jsx } from "@emotion/core";
import { Button, InputNumber, notification, Popover, Table } from "antd";
import { Faction, GameState, Mat, Player } from "./types";
import { Ctx } from "boardgame.io";
import { EventsAPI } from "boardgame.io/dist/types/src/plugins/events/events";

const BidArea = (props: {
  G: GameState;
  isActive: boolean;
  moves: Record<string, (...args: any[]) => void>;
  events: EventsAPI;
  playerInfo: Array<Player>;
  ctx: Ctx;
}) => {
  const [bids, setBids] = React.useState<{ [key: string]: number }>(
    props.G.combinations.reduce(
      (acc, combo) => ({
        ...acc,
        [`${combo.faction}:${combo.mat}`]: combo.currentBid + 1,
      }),
      {}
    )
  );
  const onBid = (faction: Faction, mat: Mat) => {
    const bid = bids[`${faction}:${mat}`];
    const currentCombo = props.G.combinations.find(
      ({ faction: f }) => faction === f
    );
    if (!currentCombo) {
      return;
    }
    const currentBid = currentCombo.currentBid;
    if (bid <= currentBid) {
      notification.error({
        message: "Error",
        description:
          currentBid > -1
            ? `The current bid for ${faction} ${mat} is ${currentBid}. You must bid at least ${
                currentBid + 1
              }.`
            : "You must bid at least 0.",
      });
      return;
    }

    if (!Number.isInteger(bid)) {
      notification.error({
        message: "Error",
        description: "Your bid must be an integer.",
      });
      return;
    }
    props.moves.bid(
      faction,
      mat,
      bid,
      props.playerInfo[Number(props.ctx.currentPlayer)]
    );
    if (typeof props.events.endTurn !== "function") {
      throw new Error("endTurn is not callable");
    }
    props.events.endTurn();
  };

  React.useEffect(() => {
    setBids(
      props.G.combinations.reduce(
        (acc, combo) => ({
          ...acc,
          [`${combo.faction}:${combo.mat}`]: combo.currentBid + 1,
        }),
        {}
      )
    );
  }, [props.G]);

  return (
    <Table
      bordered
      dataSource={props.G.combinations}
      css={{
        overflow: "auto",
        tbody: { background: "#fff" },
        ".ant-table": { overflow: "auto" },
      }}
      rowKey={(combo) => `${combo.faction}:${combo.mat}`}
      pagination={false}
    >
      <Table.Column
        css={{ background: "#fff" }}
        width={120}
        render={(combo) => {
          return (
            <div css={{ display: "flex", alignItems: "center" }}>
              <InputNumber
                key={combo.currentBid}
                defaultValue={combo.currentBid + 1}
                disabled={!props.isActive}
                value={bids[`${combo.faction}:${combo.mat}`]}
                onChange={(e: string | number | undefined) => {
                  if (typeof e !== "number") {
                    return;
                  }
                  setBids({ ...bids, [`${combo.faction}:${combo.mat}`]: e });
                }}
                type="number"
              ></InputNumber>
              <Button
                css={{ marginLeft: 12 }}
                disabled={!props.isActive}
                onClick={() => {
                  onBid(combo.faction, combo.mat);
                }}
              >
                Bid
              </Button>
            </div>
          );
        }}
      ></Table.Column>
      <Table.Column
        title="Faction"
        css={{ background: "#fff" }}
        width={72}
        dataIndex="faction"
        render={(faction) => {
          return (
            <div
              css={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={require(`./static/images/${faction}.png`)}
                alt={faction}
                css={{ width: 36, height: 36 }}
              />
              <div css={{ marginLeft: 12 }}>{faction}</div>
            </div>
          );
        }}
      />

      <Table.Column
        title="Player mat"
        css={{ background: "#fff" }}
        width={120}
        dataIndex="mat"
        render={(mat: Mat) => {
          return (
            <Popover
              content={
                <div>
                  <img
                    alt={mat}
                    src={`${process.env.PUBLIC_URL}/mats/${mat}.png`}
                    style={{ width: 630, maxWidth: "90vw", height: "auto" }}
                  />
                </div>
              }
              trigger="click"
            >
              <a
                href={`${process.env.PUBLIC_URL}/mats/${mat}.png`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {mat}
              </a>
            </Popover>
          );
        }}
      />

      <Table.Column
        title="Current bid"
        css={{ background: "#fff" }}
        width={120}
        dataIndex="currentBid"
        render={(currentBid) => {
          if (currentBid === -1) {
            return null;
          }
          return `$${currentBid}`;
        }}
      />

      <Table.Column
        title="Highest bidder"
        css={{ background: "#fff" }}
        width={120}
        dataIndex="currentHolder"
        render={(currentHolder) => {
          if (!currentHolder) {
            return null;
          }
          return currentHolder.name;
        }}
      />
    </Table>
  );
};

export default BidArea;
