import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { colors, radii, spacing } from "@/lib/theme";

type LoyaltyPayload = { points?: number; balance?: number; tier?: string; nextRewardPoints?: number; rewards?: Array<{ id?: string; name?: string; pointsCost?: number }> };

export default function LoyaltyScreen() {
  const [data,setData]=useState<LoyaltyPayload|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{void fetch("/api/loyalty",{credentials:"include"}).then(async r=>r.ok?await r.json():null).then(v=>setData(v)).catch(()=>setData(null)).finally(()=>setLoading(false));},[]);
  const points=data?.points??data?.balance??0; const next=data?.nextRewardPoints??100; const progress=Math.min(1,Math.max(0,points/Math.max(next,1)));
  return <Screen>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text variant="eyebrow">HARMONY REWARDS</Text><Text variant="title" style={styles.title}>Taste the Harmony. Earn the reward.</Text>
      <View style={styles.hero}><View><Text variant="muted">Available balance</Text>{loading?<ActivityIndicator style={styles.loader}/>:<Text style={styles.number}>{points}</Text>}<Text variant="muted">Harmony Points</Text></View><View style={styles.tier}><Text variant="eyebrow">{data?.tier??"MEMBER"}</Text></View></View>
      <View style={styles.progressCard}><View style={styles.row}><Text variant="subtitle">Your next reward</Text><Text variant="muted">{points} / {next} pts</Text></View><View style={styles.track}><View style={[styles.fill,{width:`${progress*100}%`}]} /></View><Text variant="muted" style={styles.copy}>{Math.max(0,next-points)} points to your next Harmony reward.</Text></View>
      <Text variant="subtitle" style={styles.sectionTitle}>Rewards</Text>
      {(data?.rewards?.length?data.rewards:[{name:"Signature drink reward",pointsCost:100},{name:"Dessert pairing",pointsCost:150},{name:"Harmony VIP experience",pointsCost:300}]).map((reward,index)=><View key={reward.id??String(index)} style={styles.reward}><View style={{flex:1}}><Text variant="subtitle">{reward.name}</Text><Text variant="muted" style={styles.copy}>{reward.pointsCost} points</Text></View><Pressable accessibilityRole="button" disabled={points<(reward.pointsCost??0)} style={[styles.button,points<(reward.pointsCost??0)&&styles.disabled]}><Text>Redeem</Text></Pressable></View>)}
      <View style={styles.info}><Text variant="eyebrow">HARMONY</Text><Text variant="muted" style={styles.copy}>Points are awarded from eligible completed orders. Redemptions are protected by SALORA's governed loyalty ledger.</Text></View>
    </ScrollView>
  </Screen>;
}
const styles=StyleSheet.create({
 content:{paddingBottom:spacing.xl},title:{marginTop:spacing.sm,marginBottom:spacing.lg},hero:{borderRadius:radii.lg,padding:spacing.lg,backgroundColor:"rgba(201,164,92,0.12)",borderWidth:1,borderColor:"rgba(201,164,92,0.35)",marginBottom:spacing.md,flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"},number:{color:colors.goldSoft,fontSize:58,fontWeight:"800",marginTop:spacing.xs},tier:{borderWidth:1,borderColor:"rgba(201,164,92,0.35)",borderRadius:999,paddingHorizontal:spacing.md,paddingVertical:spacing.sm},loader:{marginVertical:spacing.lg},progressCard:{borderRadius:radii.md,padding:spacing.md,backgroundColor:colors.surface,marginBottom:spacing.lg},row:{flexDirection:"row",justifyContent:"space-between",gap:spacing.md},track:{height:8,borderRadius:99,backgroundColor:"rgba(245,239,227,.08)",overflow:"hidden",marginTop:spacing.md},fill:{height:"100%",backgroundColor:colors.goldSoft,borderRadius:99},copy:{marginTop:spacing.sm},sectionTitle:{marginBottom:spacing.md},reward:{borderRadius:radii.md,padding:spacing.md,backgroundColor:colors.surface,borderWidth:1,borderColor:"rgba(245,239,227,.08)",marginBottom:spacing.md,flexDirection:"row",alignItems:"center",gap:spacing.md},button:{borderRadius:radii.md,borderWidth:1,borderColor:"rgba(201,164,92,.45)",paddingHorizontal:spacing.md,paddingVertical:spacing.sm},disabled:{opacity:.35},info:{marginTop:spacing.sm,borderRadius:radii.md,padding:spacing.md,backgroundColor:"rgba(245,239,227,.035)"}
});