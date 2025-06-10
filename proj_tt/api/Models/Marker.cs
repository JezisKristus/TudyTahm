using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace TT_API.Models
{
    public class Marker
    {

        [Key]
        public int MarkerID { get; set; }
        public int IDPoint { get; set; }
        public int IDLabel { get; set; }
        public string MarkerName { get; set; }
        public string MarkerDescription { get; set; }

        [ForeignKey("IDPoint")]
        public GPSPoint GPSPoint { get; set; }

        [ForeignKey("IDLabel")]
        public Label Label { get; set; }

    }
}
