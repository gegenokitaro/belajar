
import java.text.DecimalFormat;
import java.text.NumberFormat;

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Ritsu Tainaka
 */
public class rumus {


    double angka1 = Double.parseDouble(Kalkulator.input1.getText());
    double angka2 = Double.parseDouble(Kalkulator.input2.getText());

    public void clear() {
        Kalkulator.input1.setText("");
        Kalkulator.input2.setText("");
        Kalkulator.hasil.setText("");
    }

    protected double intiPembagian(double angka1, double angka2) {
        double hasilakhir = pembulatan(Math.exp(Math.log(angka1) - Math.log(angka2)));
        return hasilakhir;
    }

    protected double intiPerkalian(double angka1, double angka2) {
        double hasilakhir = pembulatan(Math.exp(Math.log(angka1) + Math.log(angka2)));
        return hasilakhir;
    }

    protected void samaDenganMinus(double hasilakhir) {
        Kalkulator.hasil.setText("-" + hasilakhir);
    }

    protected void samaDenganPlus(double hasilakhir) {
        Kalkulator.hasil.setText("" + hasilakhir);
    }

    protected void samaDengan(double hasilakhir) {
        Kalkulator.hasil.setText("" + hasilakhir);
    }

    double pembulatan(double f){
        NumberFormat x = new DecimalFormat("#.##########");
        return Double.valueOf(x.format(f));
    }

    public void perkalian(){

//        double angka1 = Double.parseDouble(Kalkulator.input1.getText());
//        double angka2 = Double.parseDouble(Kalkulator.input2.getText());

        if(angka1<0 && angka2<0){
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPerkalian(angka1, angka2);
            samaDenganPlus(hasilakhir);
        } else if(angka1<0 && angka2>=0){
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPerkalian(angka1, angka2);
            samaDenganMinus(hasilakhir);
        } else if(angka1>=0 && angka2<0){
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPerkalian(angka1, angka2);
            samaDenganMinus(hasilakhir);
        } else {
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPerkalian(angka1, angka2);
            samaDenganPlus(hasilakhir);
        }

//        int hasilakhir = angka1 * angka2;
//        hasil.setText("" + hasilakhir);
    }

    public void pembagian(){
//        double angka1 = Double.parseDouble(input1.getText());
//        double angka2 = Double.parseDouble(input2.getText());

        if(angka1<0 && angka2<0){
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPembagian(angka1, angka2);
            samaDenganPlus(hasilakhir);
        } else if(angka1<0 && angka2>=0){
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPembagian(angka1, angka2);
            samaDenganMinus(hasilakhir);
        } else if(angka1>=0 && angka2<0){
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPembagian(angka1, angka2);
            samaDenganMinus(hasilakhir);
        } else {
            angka1 = Math.abs(angka1);
            angka2 = Math.abs(angka2);
            double hasilakhir = intiPembagian(angka1, angka2);
            samaDenganPlus(hasilakhir);
        }

//        int angka1 = Integer.parseInt(input1.getText());
//        int angka2 = Integer.parseInt(input2.getText());
//        int hasilakhir = angka1 / angka2;
//        hasil.setText("" + hasilakhir);
    }

    public void pengurangan(){
//        double angka1 = Double.parseDouble(input1.getText());
//        double angka2 = Double.parseDouble(input2.getText());
        double hasilakhir = pembulatan(angka1 - angka2);
        samaDengan(hasilakhir);
    }

    public void penjumlahan(){
//        double angka1 = Double.parseDouble(input1.getText());
//        double angka2 = Double.parseDouble(input2.getText());
        double hasilakhir = pembulatan(angka1 + angka2);
        samaDengan(hasilakhir);
    }

}
